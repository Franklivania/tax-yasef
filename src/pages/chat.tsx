import ChatInput from "@/components/atoms/chat-input";
import MessageDisplay from "@/components/atoms/message-display";
import TaxCalculator from "@/components/atoms/tax-calculator";
import ChatHeader from "@/components/layout/chat-header";
import useDeviceSize from "@/lib/hooks/useDeviceSize";
import { useOpen } from "@/lib/hooks/useOpen";
import { Icon } from "@iconify/react";

export default function ChatDisplay() {
  const { isMobile, width } = useDeviceSize();

  const { open, setOpen, contentRef } = useOpen({
    defaultOpen: width !== null ? (isMobile ? false : true) : true,
    closeOnClickOutside: isMobile,
  });

  return (
    <main
      className={`w-full bg-background overflow-hidden ${isMobile ? "" : "flex"}`}
    >
      <div
        className="relative w-full flex flex-col h-screen transition-all duration-300 ease-in-out overflow-x-hidden fancy-scrollbar"
        style={{
          width: open ? (isMobile ? "100%" : "calc(100% - 420px)") : "100%",
          transform: isMobile && open ? "translateX(-10%)" : "translateX(0)",
        }}
        onClick={isMobile && open ? () => setOpen(false) : undefined}
      >
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 w-full h-max p-4 z-50">
          <ChatHeader setOpen={setOpen} open={open} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pt-20 pb-80 px-4 fancy-scrollbar">
          <section className="w-full max-w-3xl mx-auto">
            <MessageDisplay />
          </section>
        </div>

        {/* Fixed Bottom Section */}
        <section className="fixed bottom-0 left-0 w-full h-max p-4 z-10 bg-background/15 backdrop-blur-sm flex flex-col gap-2">
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-2">
            <span className="w-full md:w-max mx-auto p-3 rounded-md bg-muted flex items-start gap-2">
              <Icon
                icon="material-symbols:info-rounded"
                className="size-12 md:size-6 -mt-1.5 md:m-0"
              />
              <p className="font-nunito">
                You have exceeded your daily limit for this model. Please select
                a different model to continue.
              </p>
            </span>
            <span className="w-full md:w-max mx-auto p-3 rounded-md bg-destructive/10 flex items-start gap-2">
              <Icon
                icon="mynaui:danger-triangle-solid"
                className="size-8 md:size-6 text-destructive"
              />
              <p className="font-nunito text-destructive">
                You have reached maximum usage. Time resets by {0}
              </p>
            </span>
            <span className="w-full md:w-max mx-auto p-3 rounded-md bg-green-500/10 flex items-center gap-2">
              <Icon
                icon="ph:check-circle-fill"
                className="size-6 text-green-500"
              />
              <p className="font-nunito text-green-500">
                You are now using the model model.
              </p>
            </span>

            <ChatInput />

            <p className="mx-auto text-muted-foreground text-sm text-center italic">
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
        <TaxCalculator />
      </aside>
    </main>
  );
}
