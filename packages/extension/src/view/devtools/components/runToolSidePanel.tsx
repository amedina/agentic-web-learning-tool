/**
 * External dependencies.
 */
import React from 'react';

interface RunToolSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const RunToolSidePanel = ({
  isOpen,
  onClose,
  children,
}: RunToolSidePanelProps) => {
  return (
    <div
      className={`fixed inset-0 z-150 flex justify-end ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop - Fades in/out */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side Panel - Slides in/out */}
      <div
        className={`relative h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Optional: Close Button Area */}
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h2 className="text-sm font-semibold">Run Tool</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {/* SVG Close Icon */}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default RunToolSidePanel;
