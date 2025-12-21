/**
 * Focus Management Hook
 * Utilities for managing focus in accessible applications
 */

import { useEffect, useRef, type RefObject } from "react";

export interface UseFocusManagementOptions {
  /**
   * Whether to restore focus when component unmounts
   */
  restoreFocusOnUnmount?: boolean;
  /**
   * Whether to trap focus within the element
   */
  trapFocus?: boolean;
  /**
   * Whether to focus the element on mount
   */
  autoFocus?: boolean;
}

export interface UseFocusManagementReturn {
  /**
   * Ref to attach to the element
   */
  ref: RefObject<HTMLElement>;
  /**
   * Function to focus the element
   */
  focus: () => void;
  /**
   * Function to blur the element
   */
  blur: () => void;
  /**
   * Function to focus the first focusable element
   */
  focusFirst: () => void;
  /**
   * Function to focus the last focusable element
   */
  focusLast: () => void;
}

/**
 * Hook for managing focus in accessible components
 */
export function useFocusManagement(
  options: UseFocusManagementOptions = {}
): UseFocusManagementReturn {
  const {
    restoreFocusOnUnmount = false,
    trapFocus = false,
    autoFocus = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the ref
  const getFocusableElements = (): HTMLElement[] => {
    if (!ref.current) return [];

    const selector = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    return Array.from(
      ref.current.querySelectorAll<HTMLElement>(selector)
    ).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        !el.hasAttribute("aria-hidden") &&
        el.offsetParent !== null
    );
  };

  // Focus management functions
  const focus = () => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  const blur = () => {
    if (ref.current) {
      (ref.current as HTMLElement).blur();
    }
  };

  const focusFirst = () => {
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  };

  const focusLast = () => {
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  };

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && ref.current) {
      // Store previous active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the element or first focusable child
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else if (ref.current) {
        (ref.current as HTMLElement).focus();
      }
    }
  }, [autoFocus]);

  // Focus trap
  useEffect(() => {
    if (!trapFocus || !ref.current) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const element = ref.current;
    element.addEventListener("keydown", handleTabKey);

    return () => {
      element.removeEventListener("keydown", handleTabKey);
    };
  }, [trapFocus]);

  // Restore focus on unmount
  useEffect(() => {
    if (!restoreFocusOnUnmount) return;

    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocusOnUnmount]);

  return {
    ref: ref as RefObject<HTMLElement>,
    focus,
    blur,
    focusFirst,
    focusLast,
  };
}
