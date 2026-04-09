/**
 * External dependencies.
 */
import { useInfiniteHits } from "react-instantsearch";

/**
 * Internal dependencies.
 */
import { Hit } from "./hit";
import { useEffect, useRef } from "react";

export const ResultsList = ({
  onToggle,
  selectedPackages,
  activeIndex,
}: {
  onToggle: (hit: any) => void;
  selectedPackages: any[];
  activeIndex: number;
}) => {
  const { items, showMore, isLastPage } = useInfiniteHits();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current || isLastPage) return;

      const { scrollTop, scrollHeight, clientHeight } = listRef.current;

      if (scrollHeight - scrollTop <= clientHeight + 50) {
        showMore();
      }
    };

    const el = listRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);

      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [showMore, isLastPage]);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;

      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  return (
    <div
      ref={listRef}
      className="absolute left-0 right-0 mt-2 bg-white dark:bg-aswad border border-subtle-zinc dark:border-darth-vader rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto glass border-opacity-50 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {items.map((hit, index) => (
        <Hit
          key={hit.objectID}
          hit={hit}
          isSelected={selectedPackages.some((p) => p.name === hit.name)}
          isActive={index === activeIndex}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};
