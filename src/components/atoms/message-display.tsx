import { useRef, useState } from "react";
import { useMessageStore } from "@/lib/store/useMessageStore";
import { Image } from "../ui/image";
import { parseMarkdown } from "@/lib/markdown-renderer";
import { Copy, RefreshCcw, Check } from "lucide-react";
import Loader from "../ui/loader";
import { groqService, TokenLimitError } from "@/lib/services/groq";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/utils/prompt-prime";
import { buildCalculationsContext } from "@/lib/utils/calculations-context";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { useModelStore } from "@/lib/store/useModelStore";
import useDeviceSize from "@/lib/hooks/useDeviceSize";

export default function MessageDisplay({
  onRegenerate,
}: {
  onRegenerate?: () => void;
}) {
  const messages = useMessageStore((state) => state.getMessages());
  const isLoading = useMessageStore((state) => state.isLoading);
  const setLoading = useMessageStore((state) => state.setLoading);
  const addMessage = useMessageStore((state) => state.addMessage);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );
  const model = useModelStore((state) => state.model);
  const { isMobile } = useDeviceSize();
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Check if last message is user message (indicating we're waiting for response)
  const isWaitingForResponse =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "user";

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      addNotification("error", `Failed to copy to clipboard: ${error}`);
    }
  };

  const handleRegenerate = async () => {
    if (regenerating || messages.length === 0) return;

    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");

    if (!lastUserMessage) return;

    // Remove the last assistant response if it exists
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "assistant") {
      const newMessages = messages.slice(0, -1);
      useMessageStore.setState({ messages: newMessages });
    }

    setRegenerating(true);
    setLoading(true);
    onRegenerate?.();

    try {
      const promptResult = buildUserPrompt(lastUserMessage.content);
      if (promptResult.blocked) {
        addNotification(
          "error",
          promptResult.error || "This prompt is not allowed."
        );
        return;
      }

      const calculationsContext = buildCalculationsContext();
      const systemPrompt = await buildSystemPrompt(
        lastUserMessage.content,
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
      setRegenerating(false);
    }
  };

  // Check if this is the last user message
  const isLastUserMessage = (messageId: string) => {
    const lastUserMsg = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");
    return lastUserMsg?.id === messageId;
  };

  if (messages.length === 0) {
    return (
      <div className="w-full min-h-full bg-transparent flex items-center justify-center pb-4">
        <p
          className={`text-muted-foreground font-nunito text-center ${isMobile ? "text-sm px-2" : "text-base"}`}
        >
          Start a conversation about Nigerian Tax Act 2025
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-full bg-transparent flex flex-col pb-4 overflow-x-hidden ${isMobile ? "gap-2" : "gap-3"}`}
      style={{ minWidth: 0 }}
    >
      {messages.map((message) => {
        if (message.role === "user") {
          const canRefresh = isLastUserMessage(message.id);
          const isCopied = copiedId === message.id;

          return (
            <div
              key={message.id}
              className={`flex flex-col self-end ${isMobile ? "w-max max-w-[calc(100%-1rem)]" : "w-max max-w-xl"}`}
              style={{ minWidth: 0 }}
            >
              <div
                className={`w-full h-max rounded-3xl bg-primary text-primary-foreground flex flex-col ${
                  isMobile ? "p-2.5" : "p-3"
                }`}
                style={{
                  minWidth: 0,
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <p
                  className={`font-nunito whitespace-pre-wrap ${isMobile ? "text-sm" : "text-base"}`}
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    hyphens: "auto",
                  }}
                >
                  {message.content}
                </p>
              </div>

              <div
                className={`ml-auto mr-3 mt-1.5 flex items-center gap-1.5 text-muted-foreground ${isMobile ? "gap-1" : "gap-2"}`}
              >
                {canRefresh && (
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Regenerate response"
                  >
                    <RefreshCcw
                      size={isMobile ? 14 : 16}
                      className={regenerating ? "animate-spin" : ""}
                    />
                  </button>
                )}
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="hover:text-foreground transition-colors"
                  title={isCopied ? "Copied!" : "Copy message"}
                >
                  {isCopied ? (
                    <Check
                      size={isMobile ? 14 : 16}
                      className="text-green-500"
                    />
                  ) : (
                    <Copy size={isMobile ? 14 : 16} />
                  )}
                </button>
              </div>
            </div>
          );
        }

        const isCopied = copiedId === message.id;

        return (
          <div
            key={message.id}
            className={`w-full flex items-start ${isMobile ? "gap-1.5" : "gap-2"}`}
            style={{ minWidth: 0 }}
          >
            <Image
              src="/favicon.ico"
              alt="Tax Yasef"
              width={isMobile ? 24 : 32}
              height={isMobile ? 24 : 32}
              className="mt-1 shrink-0"
            />
            <div
              className="flex-1 flex flex-col gap-2 min-w-0"
              style={{ maxWidth: "100%" }}
            >
              <article
                className={`w-full h-max rounded-3xl bg-background text-foreground border border-border ${
                  isMobile ? "p-2.5" : "p-3"
                }`}
                style={{
                  minWidth: 0,
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <div
                  className={`prose prose-sm max-w-none font-nunito ${
                    isMobile
                      ? "prose-headings:text-base prose-headings:font-semibold prose-p:text-sm prose-p:my-2 prose-ul:text-sm prose-ol:text-sm prose-li:text-sm prose-table:text-sm"
                      : ""
                  }`}
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    maxWidth: "100%",
                    width: "100%",
                  }}
                >
                  {parseMarkdown(message.content)}
                </div>
              </article>
              <div
                className={`flex items-center gap-2 text-muted-foreground ${isMobile ? "ml-1" : "ml-2"}`}
              >
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="hover:text-foreground transition-colors"
                  title={isCopied ? "Copied!" : "Copy message"}
                >
                  {isCopied ? (
                    <Check
                      size={isMobile ? 12 : 14}
                      className="text-green-500"
                    />
                  ) : (
                    <Copy size={isMobile ? 12 : 14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Show loader when waiting for response */}
      {isWaitingForResponse && (
        <div
          className={`w-full flex items-start ${isMobile ? "gap-1.5" : "gap-2"}`}
        >
          <Image
            src="/favicon.ico"
            alt="Tax Yasef"
            width={isMobile ? 24 : 32}
            height={isMobile ? 24 : 32}
            className="shrink-0"
          />
          <article className="w-max h-max mt-0.5">
            <Loader className={isMobile ? "size-3" : "size-6"} />
          </article>
        </div>
      )}
    </div>
  );
}
