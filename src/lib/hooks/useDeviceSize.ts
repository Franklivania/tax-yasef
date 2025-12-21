"use client";

import { useState, useEffect } from "react";

/**
 * useDeviceSize
 *
 * Returns booleans for isMobile, isTablet, isDesktop, and the current width.
 *
 * Example usage:
 *
 *   import useDeviceSize from "@/hooks/useDeviceSize";
 *
 *   function MyComponent() {
 *     const { isMobile, isTablet, isDesktop, width } = useDeviceSize();
 *
 *     if (isMobile) return <MobileMenu />;
 *     if (isTablet) return <TabletMenu />;
 *     return <DesktopMenu />;
 *   }
 *
 */
const useDeviceSize = () => {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    // Bail out if running on the server
    if (typeof window === "undefined") return;

    const updateWidth = () => setWidth(window.innerWidth);

    // Set initial width
    updateWidth();

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const isMobile = width !== null && width < 768;
  const isTablet = width !== null && width >= 768 && width < 1024;
  const isDesktop = width !== null && width >= 1024;

  return { isMobile, isTablet, isDesktop, width };
};

export default useDeviceSize;
