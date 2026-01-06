import {
  useEffect,
  useRef,
  useState,
  startTransition,
  useCallback,
} from "react";
import { lazy, Suspense } from "react";
import ChatHeader from "@/components/layout/chat-header";
import TokenUsageNotification from "@/components/atoms/token-usage-notification";
import { OfflineIndicator } from "@/components/accessibility/offline-indicator";
import Loader from "@/components/ui/loader";
const TaxCalculator = lazy(() => import("@/components/atoms/tax-calculator"));
import useDeviceSize from "@/lib/hooks/useDeviceSize";
import { useOpen } from "@/lib/hooks/useOpen";
import { useMessageStore } from "@/lib/store/useMessageStore";
import { useHighContrastStore } from "@/lib/store/useHighContrastStore";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { getCookie, setCookie } from "@/lib/utils/storage";
import { SROnly } from "@/components/accessibility/sr-only";
import { useSearchParams } from "react-router-dom";
import ChatDisplayContainer from "@/components/sections/chat-display-container";

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
  const highContrastEnabled = useHighContrastStore((state) => state.enabled);
  const [searchParams, setSearchParams] = useSearchParams();

  // Apply high contrast mode to document
  useEffect(() => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    if (highContrastEnabled) {
      html.classList.add("high-contrast");
    } else {
      html.classList.remove("high-contrast");
    }

    return () => {
      html.classList.remove("high-contrast");
    };
  }, [highContrastEnabled]);

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

  // Update state from cookie when device size is known, or from URL parameter
  useEffect(() => {
    if (!initialized && width !== null) {
      const shouldOpenCalculator =
        searchParams.get("openCalculator") === "true";
      let savedState = getInitialCalculatorState();

      // If URL parameter says to open calculator, override saved state
      if (shouldOpenCalculator) {
        savedState = true;
        // Remove the query parameter after reading it
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("openCalculator");
        setSearchParams(newSearchParams, { replace: true });
      }

      // Use startTransition to batch state updates and prevent cascading renders
      startTransition(() => {
        setCalculatorOpen(savedState);
        setInitialized(true);
      });
    }
  }, [
    width,
    isMobile,
    initialized,
    getInitialCalculatorState,
    searchParams,
    setSearchParams,
  ]);

  // Handle opening calculator from URL parameter after initialization
  useEffect(() => {
    if (initialized) {
      const shouldOpenCalculator =
        searchParams.get("openCalculator") === "true";
      if (shouldOpenCalculator && !calculatorOpen) {
        // Use startTransition to batch state updates and prevent cascading renders
        startTransition(() => {
          setCalculatorOpen(true);
        });
        // Remove the query parameter after opening
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("openCalculator");
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [initialized, calculatorOpen, searchParams, setSearchParams]);

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
      role="main"
      aria-label="Tax Yasef Chat Interface"
    >
      <SROnly>
        <h1>Tax Yasef - Nigerian Tax Assistant</h1>
        <p>
          Chat interface for asking questions about the Nigerian Tax Act 2025.
          Use the input at the bottom to send messages.
        </p>
      </SROnly>
      <TokenUsageNotification />
      <OfflineIndicator />

      <section
        className="relative w-full flex flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden fancy-scrollbar"
        style={{
          width: open ? (isMobile ? "100%" : "calc(100% - 40vw)") : "100%",
          transform: isMobile && open ? "translateX(-10%)" : "translateX(0)",
          maxWidth: "100vw",
        }}
        onClick={isMobile && open ? () => setOpen(false) : undefined}
        role="region"
        aria-label="Tax Calculator"
      >
        <header
          className={`fixed top-0 left-0 w-full h-max z-10 ${isMobile ? "p-2 bg-background/95 backdrop-blur-sm border-b border-b-muted" : "p-4"}`}
          role="banner"
        >
          <ChatHeader setOpen={setOpen} open={open} />
        </header>

        <div className="relative flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader className="size-8" />
              </div>
            }
          >
            <TaxCalculator />
          </Suspense>
        </div>
      </section>

      <aside
        ref={contentRef}
        className={`h-screen transition-all duration-300 ease-in-out overflow-hidden ${
          isMobile ? "absolute top-0 right-0 z-50" : "shrink-0"
        }`}
        style={{
          width: open
            ? isMobile
              ? "85vw"
              : "40vw"
            : isMobile
              ? "90vw"
              : "0px",
          transform: isMobile
            ? open
              ? "translateX(0)"
              : "translateX(100%)"
            : "translateX(0)",
        }}
        role="complementary"
        aria-label="Chat"
        aria-hidden={!open}
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
              title="Close chat"
            >
              <Icon
                icon="material-symbols:close-rounded"
                className={isMobile ? "size-4" : "size-5"}
              />
            </Button>
            <ChatDisplayContainer
              scrollContainerRef={
                scrollContainerRef as React.RefObject<HTMLDivElement>
              }
              messages={messages}
              handleClearChat={handleClearChat}
              isMobile={isMobile}
              setLoading={setLoading}
            />
          </div>
        )}
      </aside>

      {/* Backdrop overlay for mobile */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-background z-40 transition-opacity duration-300"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </main>
  );
}
