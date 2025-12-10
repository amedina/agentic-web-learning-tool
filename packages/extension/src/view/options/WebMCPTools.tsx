
import { useState, useEffect } from "react";
import { Button } from '@google-awlt/design-system';
import { PlusIcon, TrashIcon, Cross2Icon, Pencil1Icon } from "@radix-ui/react-icons";


interface WebMCPScript {
    id: string;
    name: string;
    code: string;
    enabled: boolean;
    metadata: {
        name?: string;
        version?: string;
        description?: string;
        match?: string;
    };
}

const STORAGE_KEY = "webmcp_user_scripts";

export function WebMCPTools() {
    const [scripts, setScripts] = useState<WebMCPScript[]>([]);
    const [editingScript, setEditingScript] = useState<WebMCPScript | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    useEffect(() => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (result[STORAGE_KEY]) {
                setScripts(result[STORAGE_KEY]);
            }
        });
    }, []);


    const saveScripts = (updatedScripts: WebMCPScript[]) => {
        setScripts(updatedScripts);
        chrome.storage.local.set({ [STORAGE_KEY]: updatedScripts });
    };

    const handleCreateNew = () => {
        const newScript: WebMCPScript = {
            id: crypto.randomUUID(),
            name: "New Tool",
            code: `export const metadata = {
  name: "my_tool",
  version: "0.1.0",
  description: "Description of what this tool does",
  match: "<all_urls>",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" }
    },
    required: ["query"],
    additionalProperties: false
  }
};

export async function execute(args) {
  
  return \`Processed: \${args.query}\`;
}`,
            enabled: true,
            metadata: { name: "my_tool", match: "<all_urls>" },
        };
        setEditingScript(newScript);
        setIsModalOpen(true);
    };

    const handleEdit = (script: WebMCPScript) => {
        setEditingScript({ ...script });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this script?")) {
            const updated = scripts.filter((s) => s.id !== id);
            saveScripts(updated);
        }
    };

    const handleToggle = (id: string) => {
        const updated = scripts.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        );
        saveScripts(updated);
    };

    const extractMetadata = (code: string) => {


        try {
            const match = code.match(/export\s+const\s+metadata\s*=\s*({[\s\S]*?});/);
            if (match && match[1]) {





                const nameMatch = match[1].match(/name:\s*["']([^"']+)["']/);
                const matchPatternMatch = match[1].match(/match:\s*["']([^"']+)["']/);
                const versionMatch = match[1].match(/version:\s*["']([^"']+)["']/);
                const descMatch = match[1].match(/description:\s*["']([^"']+)["']/);

                return {
                    name: nameMatch ? nameMatch[1] : undefined,
                    match: matchPatternMatch ? matchPatternMatch[1] : undefined,
                    version: versionMatch ? versionMatch[1] : undefined,
                    description: descMatch ? descMatch[1] : undefined,
                };
            }
        } catch (e) {
            console.error("Failed to parse metadata", e);
        }
        return {};
    };

    const handleSaveModal = () => {
        if (!editingScript) return;

        const metadata = extractMetadata(editingScript.code);

        const updatedScript = {
            ...editingScript,
            name: metadata.name || editingScript.name,
            metadata: {
                ...editingScript.metadata,
                ...metadata
            }
        };

        const existingIndex = scripts.findIndex((s) => s.id === updatedScript.id);
        let newScripts;
        if (existingIndex >= 0) {
            newScripts = [...scripts];
            newScripts[existingIndex] = updatedScript;
        } else {
            newScripts = [...scripts, updatedScript];
        }

        saveScripts(newScripts);
        setIsModalOpen(false);
        setEditingScript(null);
    };

    return (
        <div className="w-full max-w-4xl p-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">WebMCP Tools</h2>
                <Button onClick={handleCreateNew}>
                    <PlusIcon className="mr-2" /> New Script
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.map((script) => (
                    <div
                        key={script.id}
                        className="border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow relative"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-lg">{script.metadata.name || script.name}</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">
                                    {script.metadata.version || "v0.0.0"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className={`w-10 h-6 rounded-full p-1 transition-colors ${script.enabled ? "bg-green-500" : "bg-gray-300"
                                        }`}
                                    onClick={() => handleToggle(script.id)}
                                >
                                    <div
                                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${script.enabled ? "translate-x-4" : ""
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2">
                            {script.metadata.description || "No description"}
                        </p>

                        <div className="bg-gray-100 rounded p-2 mb-4 text-xs font-mono truncate">
                            Match: <span className="bg-gray-200 px-1 rounded">{script.metadata.match || "<all_urls>"}</span>
                        </div>

                        <div className="flex justify-end gap-2 mt-auto border-t pt-3">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(script)}>
                                <Pencil1Icon className="mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(script.id)}>
                                <TrashIcon />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && editingScript && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Create/Edit WebMCP Script</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black">
                                <Cross2Icon />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 flex flex-col border-r">
                                <div className="bg-gray-100 p-2 border-b text-xs font-semibold text-gray-500">SCRIPT CODE</div>
                                <textarea
                                    className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
                                    value={editingScript.code}
                                    onChange={(e) =>
                                        setEditingScript({ ...editingScript, code: e.target.value })
                                    }
                                    spellCheck={false}
                                />
                            </div>
                            <div className="w-1/3 flex flex-col bg-gray-50">
                                <div className="bg-gray-100 p-2 border-b text-xs font-semibold text-gray-500">METADATA PREVIEW</div>
                                <div className="p-6 space-y-6 overflow-y-auto">
                                    {(() => {
                                        const meta = extractMetadata(editingScript.code);
                                        return (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Name</label>
                                                    <div className="bg-white border rounded p-2 text-sm font-mono">{meta.name || "-"}</div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Version</label>
                                                    <div className="bg-white border rounded p-2 text-sm font-mono">{meta.version || "-"}</div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Match Pattern</label>
                                                    <div className="bg-white border rounded p-2 text-sm font-mono">{meta.match || "-"}</div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                                                    <div className="bg-white border rounded p-2 text-sm">{meta.description || "-"}</div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveModal}>Save Script</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
