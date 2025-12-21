import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type RefObject,
} from "react";

export interface UseOpenOptions {
  /**
   * Initial open state
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Controlled open state (when provided, component becomes controlled)
   */
  open?: boolean;
  /**
   * Callback fired when the open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Callback fired when opening
   */
  onOpen?: () => void;
  /**
   * Callback fired when closing
   */
  onClose?: () => void;
  /**
   * Close when clicking outside the element
   * @default true
   */
  closeOnClickOutside?: boolean;
  /**
   * Close when pressing Escape key
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Prevent body scroll when open
   * @default false
   */
  preventBodyScroll?: boolean;
  /**
   * Ref to the trigger element (for click outside detection)
   */
  triggerRef?: RefObject<HTMLElement | null>;
  /**
   * Ref to the content element (for click outside detection)
   */
  contentRef?: RefObject<HTMLElement | null>;
  /**
   * Disable the hook
   * @default false
   */
  disabled?: boolean;
  /**
   * Modal mode - traps focus and prevents interaction with other elements
   * @default false
   */
  modal?: boolean;
}

export interface UseOpenReturn {
  /**
   * Current open state
   */
  open: boolean;
  /**
   * Set open state
   */
  setOpen: (open: boolean) => void;
  /**
   * Open the element
   */
  openElement: () => void;
  /**
   * Close the element
   */
  closeElement: () => void;
  /**
   * Toggle open state
   */
  toggle: () => void;
  /**
   * Ref to attach to the trigger element
   */
  triggerRef: RefObject<HTMLElement | null>;
  /**
   * Ref to attach to the content element
   */
  contentRef: RefObject<HTMLElement | null>;
  /**
   * Props to spread on the trigger element
   */
  getTriggerProps: () => {
    ref: RefObject<HTMLElement | null>;
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": boolean;
  };
  /**
   * Props to spread on the content element
   */
  getContentProps: () => {
    ref: RefObject<HTMLElement | null>;
    "aria-hidden": boolean;
  };
}

/**
 * Robust hook for managing open/close state
 *
 * @example
 * // Basic usage
 * const { open, openElement, closeElement, toggle } = useOpen();
 *
 * @example
 * // With callbacks
 * const { open, setOpen } = useOpen({
 *   onOpen: () => console.log('Opened'),
 *   onClose: () => console.log('Closed'),
 * });
 *
 * @example
 * // Controlled mode
 * const [isOpen, setIsOpen] = useState(false);
 * const { open, setOpen } = useOpen({
 *   open: isOpen,
 *   onOpenChange: setIsOpen,
 * });
 *
 * @example
 * // With click outside and escape key
 * const { open, triggerRef, contentRef } = useOpen({
 *   closeOnClickOutside: true,
 *   closeOnEscape: true,
 * });
 */
export function useOpen(options: UseOpenOptions = {}): UseOpenReturn {
  const {
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    onOpen,
    onClose,
    closeOnClickOutside = true,
    closeOnEscape = true,
    preventBodyScroll = false,
    triggerRef: externalTriggerRef,
    contentRef: externalContentRef,
    disabled = false,
    modal = false,
  } = options;

  // Internal refs (used if external refs not provided)
  const internalTriggerRef = useRef<HTMLElement>(null);
  const internalContentRef = useRef<HTMLElement>(null);

  // Use external refs if provided, otherwise use internal refs
  const triggerRef = externalTriggerRef || internalTriggerRef;
  const contentRef = externalContentRef || internalContentRef;

  // Determine if component is controlled
  const isControlled = controlledOpen !== undefined;

  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Use controlled or internal state
  const open = isControlled ? controlledOpen : internalOpen;

  // Set open state (handles both controlled and uncontrolled)
  const setOpen = useCallback(
    (newOpen: boolean) => {
      if (disabled) return;

      if (!isControlled) {
        setInternalOpen(newOpen);
      }

      onOpenChange?.(newOpen);

      if (newOpen) {
        onOpen?.();
      } else {
        onClose?.();
      }
    },
    [disabled, isControlled, onOpenChange, onOpen, onClose]
  );

  // Open element
  const openElement = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  // Close element
  const closeElement = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Toggle open state
  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!closeOnEscape || !open || disabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeElement();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeOnEscape, open, disabled, closeElement]);

  // Handle click outside
  useEffect(() => {
    if (!closeOnClickOutside || !open || disabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Check if click is outside both trigger and content
      const isOutsideTrigger =
        triggerRef.current && !triggerRef.current.contains(target);
      const isOutsideContent =
        contentRef.current && !contentRef.current.contains(target);

      if (isOutsideTrigger && isOutsideContent) {
        closeElement();
      }
    };

    // Use capture phase to catch events before they bubble
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, [
    closeOnClickOutside,
    open,
    disabled,
    triggerRef,
    contentRef,
    closeElement,
  ]);

  // Prevent body scroll when open
  useEffect(() => {
    if (!preventBodyScroll || !open || disabled) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [preventBodyScroll, open, disabled]);

  // Focus management for modal mode
  useEffect(() => {
    if (!modal || !open || disabled) return;

    const contentElement = contentRef.current;
    if (!contentElement) return;

    // Focus the content element when opened
    const focusableElements = contentElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      contentElement.focus();
    }

    // Trap focus within the modal
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    contentElement.addEventListener("keydown", handleTabKey);

    return () => {
      contentElement.removeEventListener("keydown", handleTabKey);
    };
  }, [modal, open, disabled, contentRef]);

  // Get trigger props
  const getTriggerProps = useCallback(() => {
    return {
      ref: triggerRef,
      onClick: toggle,
      "aria-expanded": open,
      "aria-haspopup": true,
    };
  }, [triggerRef, toggle, open]);

  // Get content props
  const getContentProps = useCallback(() => {
    return {
      ref: contentRef,
      "aria-hidden": !open,
    };
  }, [contentRef, open]);

  return {
    open,
    setOpen,
    openElement,
    closeElement,
    toggle,
    triggerRef,
    contentRef,
    getTriggerProps,
    getContentProps,
  };
}
