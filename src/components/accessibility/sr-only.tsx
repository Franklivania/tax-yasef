/**
 * Screen Reader Only Component
 * Provides text that is only visible to screen readers
 * Useful for accessibility announcements and hidden labels
 */

import { cn } from "@/lib/utils";

export interface SROnlyProps {
  /**
   * Text content to be read by screen readers
   */
  children: React.ReactNode;
  /**
   * Optional className for additional styling
   */
  className?: string;
  /**
   * Optional id for the element
   */
  id?: string;
  /**
   * Optional role attribute
   */
  role?: string;
  /**
   * Optional aria-live attribute for live regions
   */
  "aria-live"?: "off" | "polite" | "assertive";
  /**
   * Optional aria-atomic attribute
   */
  "aria-atomic"?: boolean;
}

/**
 * Screen Reader Only component
 * Renders content that is visually hidden but accessible to screen readers
 */
export function SROnly({
  children,
  className,
  id,
  role,
  "aria-live": ariaLive,
  "aria-atomic": ariaAtomic,
}: SROnlyProps) {
  return (
    <span
      id={id}
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={cn("sr-only", className)}
    >
      {children}
    </span>
  );
}
