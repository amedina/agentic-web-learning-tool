/**
 * External dependencies.
 */
import { useHits } from "react-instantsearch";

/**
 * Internal dependencies.
 */
import { Hit } from "./hit";

export const ResultsList = ({
  onToggle,
  selectedPackages,
}: {
  onToggle: (hit: any) => void;
  selectedPackages: any[];
}) => {
  const { hits } = useHits();

  return (
    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-aswad border border-subtle-zinc dark:border-darth-vader rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto glass border-opacity-50 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      {hits.map((hit) => (
        <Hit
          key={hit.objectID}
          hit={hit}
          isSelected={selectedPackages.some((p) => p.name === hit.name)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};
