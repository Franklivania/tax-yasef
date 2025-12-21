import {
  useEffect,
  useRef,
  useState,
  startTransition,
  useCallback,
} from "react";
import ChatInput from "@/components/atoms/chat-input";
import MessageDisplay from "@/components/atoms/message-display";
import TaxCalculator from "@/components/atoms/tax-calculator";
import ChatHeader from "@/components/layout/chat-header";
import NotificationBanner from "@/components/atoms/notification-banner";
import TokenUsageNotification from "@/components/atoms/token-usage-notification";
import useDeviceSize from "@/lib/hooks/useDeviceSize";
import { useOpen } from "@/lib/hooks/useOpen";
import { useMessageStore } from "@/lib/store/useMessageStore";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { getCookie, setCookie } from "@/lib/utils/cookies";

const TAX_CALCULATOR_COOKIE_NAME = "tax-yasef-calculator-state";
const COOKIE_EXPIRY_DAYS = 15;

export default function ChatDisplay() {
  const { isMobile, width } = useDeviceSize();
  const messages = useMessageStore((state) => state.getMessages());
  const isLoading = useMessageStore((state) => state.isLoading);
  const setLoading = useMessageStore((state) => state.setLoading);
  const clearMessages = useMessageStore((state) => state.clearMessages);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  // Get initial state from cookie or use device-based default
  const getInitialCalculatorState = useCallback((): boolean => {
    if (typeof window === "undefined") return false;

    const cookieValue = getCookie(TAX_CALCULATOR_COOKIE_NAME);
    if (cookieValue === null) {
      // No cookie, use default based on device (desktop: open, mobile: closed)
      return width !== null ? !isMobile : true;
    }

    return cookieValue === "open";
  }, [width, isMobile]);

  const [calculatorOpen, setCalculatorOpen] = useState(() => {
    // Initialize from cookie on first render
    if (typeof window !== "undefined") {
      const cookieValue = getCookie(TAX_CALCULATOR_COOKIE_NAME);
      if (cookieValue !== null) {
        return cookieValue === "open";
      }
    }
    // Default: will be set properly once width is known
    return true;
  });

  // Update state from cookie when device size is known
  useEffect(() => {
    if (!initialized && width !== null) {
      const savedState = getInitialCalculatorState();
      // Use startTransition to batch state updates and prevent cascading renders
      startTransition(() => {
        setCalculatorOpen(savedState);
        setInitialized(true);
      });
    }
  }, [width, isMobile, initialized, getInitialCalculatorState]);

  // Save state to cookie whenever it changes (after initialization)
  useEffect(() => {
    if (initialized) {
      setCookie(
        TAX_CALCULATOR_COOKIE_NAME,
        calculatorOpen ? "open" : "closed",
        {
          days: COOKIE_EXPIRY_DAYS,
          sameSite: "Lax",
          secure: true,
        }
      );
    }
  }, [calculatorOpen, initialized]);

  const handleCalculatorToggle = (newState: boolean) => {
    setCalculatorOpen(newState);
  };

  const { open, setOpen, contentRef } = useOpen({
    defaultOpen: calculatorOpen,
    open: calculatorOpen,
    onOpenChange: handleCalculatorToggle,
    closeOnClickOutside: isMobile,
  });

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Scroll to bottom on initial load if messages exist
  useEffect(() => {
    if (messages.length > 0) {
      // Multiple attempts to ensure scroll happens after layout
      const timeout1 = setTimeout(() => scrollToBottom(), 100);
      const timeout2 = setTimeout(() => scrollToBottom(), 300);
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
  }, [messages.length]); // Run when messages length changes

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      clearMessages();
    }
  };

  return (
    <main
      className={`w-full h-screen bg-background overflow-hidden ${isMobile ? "" : "flex"}`}
    >
      <TokenUsageNotification />
      <div
        className="relative w-full flex flex-col h-screen transition-all duration-300 ease-in-out overflow-x-hidden fancy-scrollbar"
        style={{
          width: open ? (isMobile ? "100%" : "calc(100% - 420px)") : "100%",
          transform: isMobile && open ? "translateX(-10%)" : "translateX(0)",
        }}
        onClick={isMobile && open ? () => setOpen(false) : undefined}
      >
        <div
          className={`fixed top-0 left-0 w-full h-max z-50 ${isMobile ? "p-2 bg-background/95 backdrop-blur-sm border-b border-b-muted" : "p-4"}`}
        >
          <ChatHeader setOpen={setOpen} open={open} />
        </div>

        <div
          ref={scrollContainerRef}
          className={`relative w-full flex-1 overflow-y-auto fancy-scrollbar ${
            isMobile ? "pt-16 pb-48 px-2" : "pt-20 pb-80 px-4"
          }`}
        >
          {messages.length > 0 && (
            <div
              className={`sticky z-10 flex justify-end ${isMobile ? "top-2 mb-2" : "top-4 mb-4"}`}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className={`bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive ${
                  isMobile ? "size-8" : "size-10"
                }`}
                title="Clear chat history"
              >
                <Icon
                  icon="material-symbols:delete-outline"
                  className={isMobile ? "size-4" : "size-5"}
                />
              </Button>
            </div>
          )}
          <section
            className={`w-full mx-auto relative overflow-x-hidden ${isMobile ? "max-w-full px-0" : "max-w-3xl"}`}
          >
            <MessageDisplay onRegenerate={() => setLoading(true)} />
          </section>
        </div>

        <section
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full h-max z-10 bg-background/15 backdrop-blur-sm flex flex-col gap-2 ${
            isMobile ? "p-2 max-w-full" : "p-4 max-w-3xl"
          }`}
        >
          <div
            className={`w-full mx-auto flex flex-col gap-2 ${isMobile ? "max-w-full" : "max-w-3xl"}`}
          >
            <NotificationBanner />

            <ChatInput />

            <p
              className={`mx-auto text-muted-foreground text-center italic ${
                isMobile ? "text-xs px-2" : "text-sm"
              }`}
            >
              You are advised to confirm the information you provide with a
              professional tax advisor.
            </p>
          </div>
        </section>
      </div>

      {/* Backdrop overlay for mobile */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        ref={contentRef}
        className={`h-screen transition-all duration-300 ease-in-out overflow-hidden ${
          isMobile ? "absolute top-0 right-0 z-50" : "shrink-0"
        }`}
        style={{
          width: open
            ? isMobile
              ? "85vw"
              : "420px"
            : isMobile
              ? "90vw"
              : "0px",
          transform: isMobile
            ? open
              ? "translateX(0)"
              : "translateX(100%)"
            : "translateX(0)",
        }}
      >
        {open && (
          <div className="relative h-full w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className={`absolute top-18 right-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive ${
                isMobile ? "size-8" : "size-10"
              }`}
              title="Close tax calculator"
            >
              <Icon
                icon="material-symbols:close-rounded"
                className={isMobile ? "size-4" : "size-5"}
              />
            </Button>
            <TaxCalculator />
          </div>
        )}
      </aside>
    </main>
  );
}
