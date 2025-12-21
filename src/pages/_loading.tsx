/**
 * Loading Screen Component
 * Displays during initial page load
 */

import { useThemeStore } from "@/lib/store/useThemeStore";
import { Image } from "@/components/ui/image";
import Loader from "@/components/ui/loader";
import { SROnly } from "@/components/accessibility/sr-only";

export default function LoadingScreen() {
  const isDark = useThemeStore((state) => state.isDark);
  const theme = useThemeStore((state) => state.theme);

  return (
    <main
      className="relative w-full h-screen overflow-hidden bg-background"
      role="main"
      aria-label="Loading Tax Yasef"
    >
      <SROnly>
        <h1>Tax Yasef - Loading</h1>
        <p>Please wait while the application loads...</p>
      </SROnly>

      {/* Background Image */}
      <Image
        src={isDark() ? "/images/dark-bg.webp" : "/images/light-bg.webp"}
        alt=""
        fill
        priority
        loading="eager"
        className="absolute top-0 left-0 w-auto h-auto object-cover z-0 opacity-50"
        key={theme}
        aria-hidden="true"
      />

      {/* Content Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-background/50 backdrop-blur-xs z-10 flex items-center justify-center">
        <section className="w-full max-w-2xl px-4 md:px-8 flex flex-col gap-6 items-center justify-center">
          {/* Logo */}
          <div className="md:w-48 md:h-48 w-32 h-32 animate-pulse">
            <Image
              src={isDark() ? "/logo-dark.svg" : "/logo.svg"}
              alt="Tax Yasef"
              className="w-full h-full"
              key={theme}
              aria-hidden="false"
            />
          </div>

          {/* Loading Spinner */}
          <div className="flex flex-col items-center gap-4">
            <Loader className="size-12 text-primary opacity-80" />
            <p className="text-muted-foreground font-nunito text-sm md:text-base text-center">
              Loading Tax Yasef...
            </p>
          </div>

          {/* Loading Message */}
          <div className="mt-4">
            <p className="text-center font-nunito md:text-lg text-base font-semibold text-foreground/80">
              Make e no do you like film. Understand wetin dey sup before e
              reach...
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
