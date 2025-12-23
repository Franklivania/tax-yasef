/**
 * Infinite scroll utilities for admin dashboard
 */

import { useState, useCallback, useEffect, useRef } from "react";

export interface InfiniteScrollConfig {
  pageSize: number;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
}

export function useInfiniteScroll<T>(items: T[], config: InfiniteScrollConfig) {
  const { pageSize, threshold = 200 } = config;
  const [displayedCount, setDisplayedCount] = useState(pageSize);
  const prevItemsLengthRef = useRef(items.length);

  const displayedItems = items.slice(0, displayedCount);
  const hasMore = displayedCount < items.length;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const scrollBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (scrollBottom < threshold && hasMore) {
        setDisplayedCount((prev) => Math.min(prev + pageSize, items.length));
      }
    },
    [hasMore, items.length, pageSize, threshold]
  );

  const reset = useCallback(() => {
    setDisplayedCount(pageSize);
  }, [pageSize]);

  // Reset when items length changes - use ref to track previous length
  // and only update state when length actually changes
  useEffect(() => {
    const prevLength = prevItemsLengthRef.current;
    if (prevLength !== items.length) {
      prevItemsLengthRef.current = items.length;
      // Use setTimeout to defer state update to avoid cascading renders
      const timeoutId = setTimeout(() => {
        setDisplayedCount(pageSize);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [items.length, pageSize]);

  return {
    displayedItems,
    hasMore,
    handleScroll,
    reset,
  };
}
