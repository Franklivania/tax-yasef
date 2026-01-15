import { useState, useRef, useEffect } from "react";
import { ModelOptions } from "@/lib/types/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useModelStore } from "@/lib/store/useModelStore";
import { useMessageStore } from "@/lib/store/useMessageStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { groqService, TokenLimitError } from "@/lib/services/groq";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/utils/ai";
import { buildCalculationsContext } from "@/lib/utils/ai";
import { Image } from "../ui/image";
import { Icon } from "@iconify/react";
import Loader from "../ui/loader";
import useDeviceSize from "@/lib/hooks/useDeviceSize";
import { sanitizeInput, containsDangerousContent } from "@/lib/utils/security";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { SROnly } from "../accessibility/sr-only";
import { Button } from "../ui/button";
import { APPROVED_DOCS, type ApprovedDocId } from "@/lib/docs/catalog";
import { ensureApprovedDocLoaded } from "@/lib/docs/library";
import { useDocsStore } from "@/lib/store/useDocsStore";

export default function ChatInput({
  onLoadingChange,
  onAfterSubmit,
}: {
  onLoadingChange?: (loading: boolean) => void;
  onAfterSubmit?: () => void;
}) {
  const model = useModelStore((state) => state.model);
  const setModel = useModelStore((state) => state.setModel);
  const getModelValue = useModelStore((state) => state.getModelValue);
  const addMessage = useMessageStore((state) => state.addMessage);
  const setLoading = useMessageStore((state) => state.setLoading);
  const isLoading = useMessageStore((state) => state.isLoading);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );
  const selectedDocId = useDocsStore((state) => state.selectedDocId);
  const setSelectedDocId = useDocsStore((state) => state.setSelectedDocId);
  const { isMobile } = useDeviceSize();
  const { isOnline } = useOnlineStatus();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 250;

    if (scrollHeight <= maxHeight) {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = "hidden";
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = async () => {
    const trimmedValue = value.trim();
    if (!trimmedValue || isLoading) return;

    // Check online status
    if (!isOnline) {
      addNotification(
        "error",
        "You are currently offline. Please check your connection and try again."
      );
      return;
    }

    // Sanitize input
    const sanitizedValue = sanitizeInput(trimmedValue);
    if (containsDangerousContent(sanitizedValue)) {
      addNotification(
        "error",
        "Input contains potentially dangerous content. Please try again."
      );
      return;
    }

    const promptResult = buildUserPrompt(sanitizedValue);
    if (promptResult.blocked) {
      addNotification(
        "error",
        promptResult.error || "This prompt is not allowed."
      );
      return;
    }

    setValue("");
    setLoading(true);

    addMessage({
      role: "user",
      content: sanitizedValue,
    });

    // Call callback after adding user message (e.g., for navigation)
    onAfterSubmit?.();

    try {
      const calculationsContext = buildCalculationsContext();
      const systemPrompt = await buildSystemPrompt(
        trimmedValue,
        calculationsContext,
        { selectedDocId }
      );
      const response = await groqService.createCompletion(
        sanitizedValue,
        systemPrompt
      );

      addMessage({
        role: "assistant",
        content: response,
        model: model,
      });
    } catch (error) {
      if (error instanceof TokenLimitError) {
        addNotification("error", error.message);
      } else if (error instanceof Error) {
        addNotification("error", error.message);
      } else {
        addNotification(
          "error",
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleModelChange = (selectedValue: string) => {
    const selectedOption = ModelOptions.find(
      (option) => option.value === selectedValue
    );
    if (selectedOption) {
      setModel(selectedOption.label);
      addNotification("success", `You are now using ${selectedOption.label}.`);
    }
  };

  const handleDocChange = async (docId: ApprovedDocId | null) => {
    setSelectedDocId(docId);

    if (!docId) {
      addNotification(
        "success",
        "Auto mode: I'll choose the best approved Act."
      );
      return;
    }

    if (!isOnline) {
      addNotification(
        "error",
        "You're offline. Connect to the internet to load and chat with a document."
      );
      return;
    }

    addNotification(
      "success",
      `Primary document set: ${APPROVED_DOCS.find((d) => d.id === docId)?.shortTitle || "Approved Act"}`
    );

    // Warm up the selected doc in the background (cached in IndexedDB after first ingest).
    try {
      await ensureApprovedDocLoaded(docId);
    } catch (err) {
      addNotification(
        "error",
        err instanceof Error
          ? err.message
          : "Failed to load the selected document. Please try again."
      );
    }
  };

  return (
    <div
      className="w-full p-1 rounded-3xl light-gradient"
      style={{ minWidth: 0, maxWidth: "100%" }}
    >
      <div
        className={`w-full h-full bg-muted rounded-2xl grid ${isMobile ? "p-2.5 gap-2" : "p-3 md:p-6 gap-3"}`}
        style={{ minWidth: 0, maxWidth: "100%" }}
      >
        <div
          className={`w-full flex items-start ${isMobile ? "gap-1.5" : "gap-2"}`}
          style={{ minWidth: 0 }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className={`w-full resize-none outline-none border-none muted-scrollbar font-nunito text-foreground disabled:opacity-50 ${
              isMobile ? "min-h-8 text-sm" : "min-h-10 text-base"
            }`}
            style={{
              maxHeight: isMobile ? "150px" : "250px",
              minWidth: 0,
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
            placeholder="Make we talk this Nigerian Tax thing..."
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !value.trim() || !isOnline}
            className={`bg-secondary rounded-full hover:bg-secondary/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
              isMobile ? "p-1.5" : "p-2"
            }`}
            aria-label="Send message"
            aria-describedby="send-button-description"
          >
            <SROnly id="send-button-description">
              {isLoading
                ? "Sending message..."
                : !isOnline
                  ? "Cannot send while offline"
                  : "Send your message"}
            </SROnly>
            {isLoading ? (
              <Loader className={isMobile ? "size-6" : "size-8"} />
            ) : (
              <Icon
                icon="iconamoon:send-light"
                className={`-rotate-45 ${isMobile ? "size-6" : "size-8"}`}
              />
            )}
          </button>
        </div>
        <section
          className={`w-full flex items-center ${isMobile ? "gap-1.5" : "gap-2"} overflow-x-auto muted-scrollbar`}
          aria-label="Choose an approved document to chat with"
        >
          <span className="text-xs font-nunito text-muted-foreground shrink-0">
            Talk to:
          </span>
          <Button
            type="button"
            size="sm"
            variant={selectedDocId === null ? "secondary" : "outline"}
            onClick={() => handleDocChange(null)}
            disabled={isLoading}
            aria-pressed={selectedDocId === null}
            className="shrink-0"
            title="Auto: choose the best approved Act for your question"
          >
            Auto
          </Button>
          {APPROVED_DOCS.map((doc) => (
            <Button
              key={doc.id}
              type="button"
              size="sm"
              variant={selectedDocId === doc.id ? "secondary" : "outline"}
              onClick={() => handleDocChange(doc.id)}
              disabled={isLoading || !isOnline}
              aria-pressed={selectedDocId === doc.id}
              className="shrink-0"
              title={doc.title}
            >
              {doc.shortTitle}
            </Button>
          ))}
          <SROnly>
            Approved documents only. If none is selected, Auto mode will route
            your question to the best matching approved Act.
          </SROnly>
        </section>
        <section
          className={`flex items-center ${isMobile ? "gap-1.5" : "gap-2"}`}
        >
          {isLoading ? (
            <Loader className={isMobile ? "size-6" : "size-8"} />
          ) : (
            <Image
              src="/favicon.ico"
              alt="Tax Yasef"
              width={isMobile ? 24 : 32}
              height={isMobile ? 24 : 32}
              className="shrink-0"
            />
          )}
          <SROnly>
            <label htmlFor="model-select">Select AI model</label>
          </SROnly>
          <Select
            value={getModelValue()}
            onValueChange={handleModelChange}
            disabled={isLoading || !isOnline}
          >
            <SelectTrigger
              id="model-select"
              disabled={isLoading || !isOnline}
              className={isMobile ? "h-8 text-xs" : "h-10 text-sm"}
              aria-label={`Current model: ${model}`}
            >
              <SelectValue placeholder={model} />
            </SelectTrigger>
            <SelectContent>
              {ModelOptions.map((modelOption) => (
                <SelectItem key={modelOption.value} value={modelOption.value}>
                  {modelOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      </div>
    </div>
  );
}
