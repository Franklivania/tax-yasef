import { type Themes, useThemeStore } from "@/lib/store/useThemeStore";
import { Image } from "../ui/image";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Icon } from "@iconify/react";
import InfoModal from "../modals/info-modal";
import useDeviceSize from "@/lib/hooks/useDeviceSize";

export default function ChatHeader({
  setOpen,
  open,
}: {
  setOpen: (open: boolean) => void;
  open?: boolean;
}) {
  const isDark = useThemeStore((state) => state.isDark);
  const { isMobile } = useDeviceSize();

  return (
    <header
      className="w-full bg-transparent flex items-center justify-between"
      style={{ minWidth: 0, maxWidth: "100%" }}
    >
      <div className={`shrink-0 ${isMobile ? "w-8 h-8" : "w-12 h-12"}`}>
        {isDark() ? (
          <Image
            src="/logo-dark.svg"
            alt="Tax Yasef"
            className="w-auto h-auto"
          />
        ) : (
          <Image src="/logo.svg" alt="Tax Yasef" className="w-auto h-auto" />
        )}
      </div>

      <aside
        className="flex items-center gap-1 md:gap-2 shrink-0"
        style={{ minWidth: 0 }}
      >
        <InfoModal>
          <Button
            variant="ghost"
            size={isMobile ? "icon" : "default"}
            className="flex items-center gap-1 md:gap-2"
          >
            <Icon
              icon="material-symbols:info-rounded"
              className={isMobile ? "size-4" : "size-5"}
            />
            {!isMobile && <span>Info</span>}
          </Button>
        </InfoModal>

        <Button
          variant="ghost"
          size={isMobile ? "sm" : "default"}
          onClick={() => setOpen(!open)}
          className={isMobile ? "text-xs px-2" : "text-sm"}
        >
          {isMobile ? "Calculator" : "Tax Calculator"}
        </Button>

        <ThemeSwitcher />
      </aside>
    </header>
  );
}

export function ThemeSwitcher() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const getThemeIcon = (themeValue: Themes) => {
    switch (themeValue) {
      case "dark":
        return "material-symbols-light:dark-mode-rounded";
      case "light":
        return "ix:light-dark";
      case "system":
        return "mingcute:laptop-line";
    }
  };

  const getThemeLabel = (themeValue: Themes) => {
    switch (themeValue) {
      case "dark":
        return "Dark mode";
      case "light":
        return "Light mode";
      case "system":
        return "System";
    }
  };

  return (
    <Select
      value={theme}
      onValueChange={(value: string) => setTheme(value as Themes)}
    >
      <SelectTrigger className="w-[70px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon icon={getThemeIcon(theme)} />
            <span>{getThemeLabel(theme)}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">
          <Icon icon="material-symbols-light:dark-mode-rounded" />
          <span>Dark mode</span>
        </SelectItem>
        <SelectItem value="light">
          <Icon icon="ix:light-dark" />
          <span>Light mode</span>
        </SelectItem>
        <SelectItem value="system">
          <Icon icon="mingcute:laptop-line" />
          <span>System</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
