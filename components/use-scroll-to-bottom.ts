import { useEffect, useRef, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver(() => {
        end.scrollIntoView({ behavior: "smooth", block: "end" });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });
      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}
