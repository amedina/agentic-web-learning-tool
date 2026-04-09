/**
 * External dependencies.
 */
import { Check } from "lucide-react";

interface HitProps {
  hit: any;
  isSelected: boolean;
  onToggle: (hit: any) => void;
}

export const Hit = ({ hit, isSelected, onToggle }: HitProps) => {
  return (
    <div
      onClick={() => onToggle(hit)}
      className={`p-4 border-b border-subtle-zinc dark:border-darth-vader hover:bg-baby-blue/10 dark:hover:bg-baby-blue/20 cursor-pointer transition-all flex justify-between items-center group/hit ${
        isSelected ? "bg-baby-blue/5 dark:bg-baby-blue/10" : ""
      }`}
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="font-semibold text-text-primary truncate group-hover/hit:text-baby-blue transition-colors">
          {hit.name}
        </div>
        <div className="text-xs text-amethyst-haze leading-relaxed truncate mt-0.5">
          {hit.description}
        </div>
      </div>
      <div
        className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-baby-blue border-baby-blue shadow-[0_2px_8px_rgba(59,130,246,0.4)] scale-110"
            : "border-strong-zinc dark:border-darth-vader bg-bg-surface dark:bg-aswad group-hover/hit:border-baby-blue/50"
        }`}
      >
        {isSelected && (
          <Check className="w-4 h-4 text-white stroke-[4px] animate-in zoom-in duration-200" />
        )}
      </div>
    </div>
  );
};
