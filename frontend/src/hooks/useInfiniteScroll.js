import { useEffect, useRef, useCallback } from "react";

/**
 * Infinite scroll hook using IntersectionObserver.
 * @param {Function} onLoadMore - called when sentinel is visible
 * @param {boolean} hasMore - whether more data exists
 * @param {boolean} isLoading - whether a fetch is in progress
 */
export default function useInfiniteScroll(onLoadMore, hasMore, isLoading) {
  const sentinelRef = useRef(null);

  const handleIntersect = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return sentinelRef;
}
