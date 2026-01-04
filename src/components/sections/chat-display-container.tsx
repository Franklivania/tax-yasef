import { Suspense } from "react";
import { lazy } from "react";
const MessageDisplay = lazy(() => import("@/components/atoms/message-display"));
import Loader from "../ui/loader";
import type { Message } from "@/lib/store/useMessageStore";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
import NotificationBanner from "../atoms/notification-banner";
import ChatInput from "../atoms/chat-input";

type ChatDisplayProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement> | null;
  messages: Message[];
  handleClearChat: () => void;
  isMobile: boolean;
  setLoading: (loading: boolean) => void;
  children?: React.ReactNode;
};

export default function ChatDisplayContainer({
  open,
  setOpen,
  scrollContainerRef,
  messages,
  handleClearChat,
  isMobile,
  setLoading,
  children,
}: ChatDisplayProps) {
  return (
    <div
      className="relative w-full flex flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden fancy-scrollbar"
      style={{
        width: open ? (isMobile ? "100%" : "calc(100% - 40vw)") : "100%",
        transform: isMobile && open ? "translateX(-10%)" : "translateX(0)",
        maxWidth: "100vw",
      }}
      onClick={isMobile && open ? () => setOpen(false) : undefined}
    >
      {children}
      <div
        ref={scrollContainerRef}
        className={`relative w-full flex-1 overflow-y-auto overflow-x-hidden fancy-scrollbar ${
          isMobile ? "pt-16 pb-56" : "pt-20 pb-80"
        }`}
      >
        {messages.length > 0 && (
          <div
            className={`sticky z-10 flex justify-end ${isMobile ? "top-2 mb-2 px-2" : "top-4 mb-4 px-4"}`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className={`bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive ${
                isMobile ? "size-8" : "size-10"
              }`}
              title="Clear chat history"
              aria-label="Clear all chat messages"
            >
              <Icon
                icon="material-symbols:delete-outline"
                className={isMobile ? "size-4" : "size-5"}
              />
            </Button>
          </div>
        )}
        <section
          className={`w-full mx-auto relative overflow-x-hidden ${
            isMobile ? "max-w-full px-2" : "max-w-3xl px-4"
          }`}
          style={{ minWidth: 0 }}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Loader className="size-8" />
              </div>
            }
          >
            <MessageDisplay onRegenerate={() => setLoading(true)} />
          </Suspense>
        </section>
      </div>

      <section
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full h-max z-10 bg-background/15 backdrop-blur-sm flex flex-col gap-2 ${
          isMobile ? "p-2 max-w-full" : "p-4 max-w-3xl"
        }`}
        style={{ maxWidth: isMobile ? "100vw" : undefined }}
      >
        <div
          className={`w-full mx-auto flex flex-col gap-2 pb-6 md:pb-3 ${
            isMobile ? "max-w-full px-0" : "max-w-3xl"
          }`}
          style={{ minWidth: 0 }}
        >
          <NotificationBanner />

          <ChatInput />

          <p
            className={`mx-auto text-muted-foreground text-center italic ${
              isMobile ? "text-xs px-2" : "text-sm"
            }`}
          >
            You are advised to confirm the information gotten here with a
            professional tax advisor.
          </p>
          <span className="mx-auto text-center text-muted-foreground text-xs">
            With 👨🏾‍💻 and 🎨 by{" "}
            <a
              href="https://x.com/OdigboF"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground"
            >
              Chibuzo Franklin
            </a>{" "}
            and{" "}
            <a
              href="https://x.com/OlarindeSodiq20"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground"
            >
              Olarinde Sodiq
            </a>
          </span>
        </div>
      </section>
    </div>
  );
}
