import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import useDeviceSize from "@/lib/hooks/useDeviceSize";
import { nav_items, type NavItem } from "./nav-list";
import NewsletterModal from "../modals/newsletter-modal";
import AboutModal from "../modals/about-modal";

export default function NavHandler() {
  const { isMobile } = useDeviceSize();
  const [menuOpen, setMenuOpen] = useState(false);

  const renderItem = (item: NavItem, variant: "mobile" | "desktop") => {
    const isMobileVariant = variant === "mobile";
    const button = (
      <Button
        variant="ghost"
        size={isMobileVariant ? "default" : "sm"}
        className={
          isMobileVariant ? "w-full justify-start" : "text-sm whitespace-nowrap"
        }
        aria-label={item.label}
        onClick={isMobileVariant ? () => setMenuOpen(false) : undefined}
      >
        <Icon icon={item.icon} className="size-4" />
        <span className="ml-2">{item.label}</span>
      </Button>
    );

    if ("link" in item) {
      return isMobileVariant ? (
        <Link
          to={item.link}
          className="block"
          onClick={() => setMenuOpen(false)}
        >
          {button}
        </Link>
      ) : (
        <Link to={item.link} className="inline-flex">
          {button}
        </Link>
      );
    }

    return item.dialog === "newsletter" ? (
      <NewsletterModal>{button}</NewsletterModal>
    ) : (
      <AboutModal>{button}</AboutModal>
    );
  };

  return (
    <div className="flex-1 flex items-center">
      {isMobile ? (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              className="ml-3 mr-auto"
            >
              <Icon icon="material-symbols:menu-rounded" className="size-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-[60vw] max-w-[320px] p-0 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-3 border-b border-muted">
              <span className="text-sm font-medium">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <Icon
                  icon="material-symbols:close-rounded"
                  className="size-5"
                />
              </Button>
            </div>
            <nav className="p-2" aria-label="Primary navigation">
              <ul className="flex flex-col gap-1">
                {nav_items.map((item) => (
                  <li key={item.label}>{renderItem(item, "mobile")}</li>
                ))}
              </ul>
            </nav>
          </PopoverContent>
        </Popover>
      ) : (
        <nav className="w-max px-4 py-3 rounded-full mx-auto bg-background/15 backdrop-blur-sm border border-muted">
          <ul
            className="flex items-center gap-1"
            aria-label="Primary navigation"
          >
            {nav_items.map((item) => (
              <li key={item.label} className="shrink-0">
                {renderItem(item, "desktop")}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
