/**
 * Virtual Message List Component
 * Efficiently renders long message lists using virtual scrolling
 */

import { useRef, useEffect, useState, useMemo } from "react";
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
import { SROnly } from "./sr-only";

interface VirtualMessageListProps {
  onRegenerate?: () => void;
  /**
   * Height of each message item in pixels (estimated)
   */
  itemHeight?: number;
  /**
   * Number of items to render outside viewport (buffer)
   */
  overscan?: number;
}

interface VirtualItem {
  index: number;
  offset: number;
  height: number;
}

/**
 * Calculate virtual items to render based on scroll position
 */
function calculateVirtualItems(
  containerHeight: number,
  scrollTop: number,
  itemCount: number,
  itemHeight: number,
  overscan: number
): VirtualItem[] {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const items: VirtualItem[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    items.push({
      index: i,
      offset: i * itemHeight,
      height: itemHeight,
    });
  }

  return items;
}

export default function VirtualMessageList({
  onRegenerate,
  itemHeight = 100,
  overscan = 3,
}: VirtualMessageListProps) {
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
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Update container height on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Calculate virtual items
  const virtualItems = useMemo(() => {
    if (messages.length === 0) return [];
    return calculateVirtualItems(
      containerHeight || 1000,
      scrollTop,
      messages.length,
      itemHeight,
      overscan
    );
  }, [messages.length, containerHeight, scrollTop, itemHeight, overscan]);

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
          className={`text-muted-foreground font-nunito text-center ${
            isMobile ? "text-sm px-2" : "text-base"
          }`}
        >
          Start a conversation about Nigerian Tax Act 2025
        </p>
      </div>
    );
  }

  const totalHeight = messages.length * itemHeight;
  const startOffset = virtualItems[0]?.offset || 0;
  const endOffset = virtualItems[virtualItems.length - 1]?.offset || 0;

  return (
    <div
      ref={containerRef}
      className="w-full min-h-full bg-transparent grid pb-4 overflow-x-hidden relative"
      style={{ minHeight: totalHeight }}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      aria-atomic="false"
    >
      <SROnly>
        {messages.length} message{messages.length !== 1 ? "s" : ""} in
        conversation
      </SROnly>

      {/* Spacer for items before viewport */}
      {startOffset > 0 && (
        <div style={{ height: startOffset }} aria-hidden="true" />
      )}

      {/* Render visible items */}
      {virtualItems.map((virtualItem) => {
        const message = messages[virtualItem.index];
        if (!message) return null;

        if (message.role === "user") {
          const canRefresh = isLastUserMessage(message.id);
          const isCopied = copiedId === message.id;

          return (
            <div
              key={message.id}
              className={`flex flex-col justify-self-end ${
                isMobile ? "w-[95%]" : "w-max"
              }`}
              style={{ minHeight: itemHeight }}
              role="article"
              aria-label={`User message ${virtualItem.index + 1}`}
            >
              <div
                className={`w-full ${
                  isMobile ? "max-w-full" : "md:w-max md:max-w-xl"
                } h-max rounded-3xl bg-primary text-primary-foreground flex flex-col ${
                  isMobile ? "p-2.5" : "p-3"
                }`}
              >
                <p
                  className={`font-nunito whitespace-pre-wrap ${
                    isMobile ? "text-sm" : "text-base"
                  }`}
                  style={{ wordBreak: "break-word" }}
                >
                  {message.content}
                </p>
              </div>

              <div
                className={`ml-auto mr-3 mt-1.5 flex items-center gap-1.5 text-muted-foreground ${
                  isMobile ? "gap-1" : "gap-2"
                }`}
              >
                {canRefresh && (
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Regenerate response"
                    aria-label="Regenerate response"
                  >
                    <RefreshCcw
                      size={isMobile ? 14 : 16}
                      className={regenerating ? "animate-spin" : ""}
                      aria-hidden="true"
                    />
                  </button>
                )}
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="hover:text-foreground transition-colors"
                  title={isCopied ? "Copied!" : "Copy message"}
                  aria-label={isCopied ? "Copied to clipboard" : "Copy message"}
                >
                  {isCopied ? (
                    <Check
                      size={isMobile ? 14 : 16}
                      className="text-green-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy size={isMobile ? 14 : 16} aria-hidden="true" />
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
            className={`w-full flex items-start overflow-hidden ${
              isMobile ? "gap-1.5" : "gap-2"
            }`}
            style={{ minHeight: itemHeight }}
            role="article"
            aria-label={`Assistant message ${virtualItem.index + 1}`}
          >
            <Image
              src="/favicon.ico"
              alt="Tax Yasef"
              width={isMobile ? 24 : 32}
              height={isMobile ? 24 : 32}
              className="mt-1 shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden">
              <article
                className={`w-full h-max rounded-3xl bg-background text-foreground border border-border overflow-hidden ${
                  isMobile ? "p-2.5 max-w-[98%]" : "p-3 max-w-full"
                }`}
              >
                <div
                  className={`prose max-w-none font-nunito ${
                    isMobile
                      ? "prose-sm prose-headings:text-base prose-headings:font-semibold prose-p:text-sm prose-p:my-2 prose-ul:text-sm prose-ol:text-sm prose-li:text-sm"
                      : "prose-sm"
                  }`}
                >
                  {parseMarkdown(message.content)}
                </div>
              </article>
              <div
                className={`flex items-center gap-2 text-muted-foreground ${
                  isMobile ? "ml-1" : "ml-2"
                }`}
              >
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="hover:text-foreground transition-colors"
                  title={isCopied ? "Copied!" : "Copy message"}
                  aria-label={isCopied ? "Copied to clipboard" : "Copy message"}
                >
                  {isCopied ? (
                    <Check
                      size={isMobile ? 12 : 14}
                      className="text-green-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy size={isMobile ? 12 : 14} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Spacer for items after viewport */}
      {endOffset < totalHeight && (
        <div
          style={{ height: totalHeight - endOffset - itemHeight }}
          aria-hidden="true"
        />
      )}

      {/* Show loader when waiting for response */}
      {isWaitingForResponse && (
        <div
          className={`w-full flex items-start ${
            isMobile ? "gap-1.5" : "gap-2"
          }`}
          role="status"
          aria-live="polite"
          aria-label="Loading response"
        >
          <Image
            src="/favicon.ico"
            alt="Tax Yasef"
            width={isMobile ? 24 : 32}
            height={isMobile ? 24 : 32}
            className="shrink-0"
            aria-hidden="true"
          />
          <article className="w-max h-max mt-0.5">
            <Loader className={isMobile ? "size-3" : "size-6"} />
          </article>
          <SROnly>Generating response...</SROnly>
        </div>
      )}
    </div>
  );
}
