import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export default function Loader({ className }: { className?: string }) {
  return (
    <Icon
      icon="icomoon-free:spinner10"
      className={cn("size-8 animate-spin opacity-70", className)}
    />
  );
}
