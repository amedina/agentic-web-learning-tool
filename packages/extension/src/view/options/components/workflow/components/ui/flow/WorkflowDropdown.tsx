/**
 * External dependencies
 */
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Upload, Download, Trash2, FolderOpen } from 'lucide-react';

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

  // Close dropdown when clicking outside
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
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
            ? 'bg-slate-200 text-slate-900'
            : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
        }`}
        title="Workflow Actions"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-left">
          <button
            onClick={() => handleAction(onNew)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
          >
            <Plus
              size={16}
              className="text-slate-400 group-hover:text-indigo-500 transition-colors"
            />
            <span className="font-medium">New Workflow</span>
          </button>

          <button
            onClick={() => handleAction(onLoadSaved)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
          >
            <FolderOpen
              size={16}
              className="text-slate-400 group-hover:text-indigo-500 transition-colors"
            />
            <span className="font-medium">Load Saved</span>
          </button>

          <button
            onClick={() => handleAction(onImport)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
          >
            <Upload
              size={16}
              className="text-slate-400 group-hover:text-indigo-500 transition-colors"
            />
            <span className="font-medium">Import JSON</span>
          </button>

          <button
            onClick={() => handleAction(onExport)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
          >
            <Download
              size={16}
              className="text-slate-400 group-hover:text-indigo-500 transition-colors"
            />
            <span className="font-medium">Export JSON</span>
          </button>

          <div className="h-px bg-slate-100 my-1 mx-2" />

          <button
            onClick={() => handleAction(onClear)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors group"
          >
            <Trash2
              size={16}
              className="text-red-400 group-hover:text-red-500 transition-colors"
            />
            <span className="font-medium">Clear Canvas</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowDropdown;
