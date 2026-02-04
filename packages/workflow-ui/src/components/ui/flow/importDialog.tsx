import { X } from "lucide-react";

interface ImportDialogProps {
  setShowImportDialog: (show: boolean) => void;
  importJson: string;
  setImportJson: (json: string) => void;
  handleImportSubmit: () => void;
}

const ImportDialog = ({
  setShowImportDialog,
  importJson,
  setImportJson,
  handleImportSubmit,
}: ImportDialogProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-2xl mx-4 border border-slate-200 dark:border-border shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">
            Import Workflow
          </h3>
          <button
            onClick={() => setShowImportDialog(false)}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mb-4">
          <label
            htmlFor="import-json"
            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2"
          >
            Paste workflow JSON:
          </label>
          <textarea
            id="import-json"
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 dark:border-zinc-700 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 text-slate-900 dark:text-foreground"
            placeholder='{"title": "My Workflow", "nodes": [...], "edges": [...], "savedAt": "..."}'
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowImportDialog(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImportSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;
