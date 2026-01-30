/**
 * External dependencies
 */
import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Upload,
  Download,
  Trash2,
  FolderOpen,
  Ellipsis,
} from "lucide-react";

interface WorkflowDropdownProps {
  onNew: () => void;
  onImport: () => void;
  onExport: () => void;
  onClear: () => void;
  onLoadSaved: () => void;
}

const WorkflowDropdown: React.FC<WorkflowDropdownProps> = ({
  onNew,
  onImport,
  onExport,
  onClear,
  onLoadSaved,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center p-2 transition-all rounded-md ${
          isOpen
            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-foreground shadow-inner"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground"
        }`}
        title="Workflow Actions"
      >
        <Ellipsis size={20} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-border rounded-lg shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-left">
          <button
            onClick={() => handleAction(onNew)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors group"
          >
            <Plus
              size={16}
              className="text-slate-400 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors"
            />
            <span className="font-medium">New Workflow</span>
          </button>

          <button
            onClick={() => handleAction(onLoadSaved)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors group"
          >
            <FolderOpen
              size={16}
              className="text-slate-400 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors"
            />
            <span className="font-medium">Load Saved</span>
          </button>

          <button
            onClick={() => handleAction(onImport)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors group"
          >
            <Upload
              size={16}
              className="text-slate-400 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors"
            />
            <span className="font-medium">Import JSON</span>
          </button>

          <button
            onClick={() => handleAction(onExport)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors group"
          >
            <Download
              size={16}
              className="text-slate-400 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors"
            />
            <span className="font-medium">Export JSON</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-border my-1 mx-2" />

          <button
            onClick={() => handleAction(onClear)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group"
          >
            <Trash2
              size={16}
              className="text-red-400 dark:text-red-900/50 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors"
            />
            <span className="font-medium">Clear Canvas</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowDropdown;
