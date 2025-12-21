import { useThemeStore } from "./lib/store/useThemeStore";
import { Image } from "./components/ui/image";
import { ThemeSwitcher } from "@/components/layout/chat-header";
import { Button } from "./components/ui/button";
import { useNavigate } from "react-router-dom";
import ChatInput from "./components/atoms/chat-input";

function App() {
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const isDark = useThemeStore((state) => state.isDark);

  const handleNavigate = () => {
    navigate("/chat");
  };

  const handleAfterSubmit = () => {
    navigate("/chat");
  };

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-background/50 backdrop-blur-xs z-10">
        <span className="absolute top-4 right-4">
          <ThemeSwitcher />
        </span>

        <section className="w-full max-w-2xl px-4 md:px-8 lg:pd-0 h-max flex flex-col gap-6 items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute">
          <div className="md:w-48 md:h-48 w-24 h-24">
            <Image
              src={isDark() ? "/logo-dark.svg" : "/logo.svg"}
              alt="Tax Yasef"
              className="w-full h-full"
              key={theme}
            />
          </div>
          <h3 className="text-center font-nunito md:text-4xl text-xl font-semibold">
            Make e no do you like film. Understand wetin dey sup before e
            reach...
          </h3>

          <section className="w-full flex flex-col gap-2">
            <Button
              variant="secondary"
              className="button-gradient w-max ml-auto font-nunito text-base py-5"
              onClick={handleNavigate}
            >
              Click to calculate your tax
            </Button>
            <ChatInput onAfterSubmit={handleAfterSubmit} />
          </section>

          <p className="text-sm mx-auto text-center text-muted-foreground">
            Conversations with Tax Yasef center around the Nigerian Tax Act 2025
            document as is stipulated in the Act. For further confirmation,
            reach out to a professional tax advisor or counsel.
          </p>
        </section>
      </div>

      <Image
        src={isDark() ? "/images/dark-bg.webp" : "/images/light-bg.webp"}
        alt="Background"
        fill
        priority
        loading="eager"
        className="absolute top-0 left-0 w-auto h-auto object-cover z-0"
        key={theme}
      />
    </main>
  );
}

export default App;
