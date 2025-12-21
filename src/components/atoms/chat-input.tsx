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
import { buildSystemPrompt, buildUserPrompt } from "@/lib/utils/prompt-prime";
import { buildCalculationsContext } from "@/lib/utils/calculations-context";
import { Image } from "../ui/image";
import { Icon } from "@iconify/react";
import Loader from "../ui/loader";
import useDeviceSize from "@/lib/hooks/useDeviceSize";

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
  const { isMobile } = useDeviceSize();
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

    const promptResult = buildUserPrompt(trimmedValue);
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
      content: trimmedValue,
    });

    // Call callback after adding user message (e.g., for navigation)
    onAfterSubmit?.();

    try {
      const calculationsContext = buildCalculationsContext();
      const systemPrompt = await buildSystemPrompt(
        trimmedValue,
        calculationsContext
      );
      const response = await groqService.createCompletion(
        promptResult.prompt,
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

  return (
    <div className="w-full p-1 rounded-3xl light-gradient">
      <div
        className={`w-full h-full bg-muted rounded-2xl grid ${isMobile ? "p-2.5 gap-2" : "p-3 md:p-6 gap-3"}`}
      >
        <div
          className={`w-full flex items-start ${isMobile ? "gap-1.5" : "gap-2"}`}
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
            style={{ maxHeight: isMobile ? "150px" : "250px" }}
            placeholder="Make we talk this Nigerian Tax thing..."
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            className={`bg-secondary rounded-full hover:bg-secondary/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
              isMobile ? "p-1.5" : "p-2"
            }`}
          >
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
          <Select
            value={getModelValue()}
            onValueChange={handleModelChange}
            disabled={isLoading}
          >
            <SelectTrigger
              disabled={isLoading}
              className={isMobile ? "h-8 text-xs" : "h-10 text-sm"}
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
