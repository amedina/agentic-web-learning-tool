/**
 * External dependencies.
 */
import { PlayIcon, CheckIcon, AlertCircleIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../tabs';
import { ExtractMetadata } from './extractMetadata';

interface MetadataPanelProps {
    code: string;
    activeTab: string;
    onTabChange: (tab: string) => void;
    validationState: 'idle' | 'valid' | 'invalid';
    errorMsg: string;
    onValidate: () => void;
}

export function MetadataPanel({
    code,
    activeTab,
    onTabChange,
    validationState,
    errorMsg,
    onValidate
}: MetadataPanelProps) {
    const metadata = ExtractMetadata(code);

    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col flex-1 overflow-hidden">
            {/* Tabs Header */}
            <div className="bg-white px-4 border-b border-gray-200 flex-none">
                <TabsList className="w-full grid grid-cols-2 bg-transparent h-12 p-0 gap-8">
                    <TabsTrigger value="metadata" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0">Metadata</TabsTrigger>
                    <TabsTrigger value="validation" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0">Validation</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="metadata" className="m-0 p-0 border-0 bg-transparent space-y-6">
                    <div>
                        <h3 className="font-semibold mb-3 text-sm text-gray-900 border-b pb-2">Parsed Metadata</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Name</label>
                                <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-700">{metadata.name || "—"}</div>
                                <p className="text-[10px] text-gray-400 mt-1">Unique identifier for the tool (e.g. "search_web")</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Namespace</label>
                                <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-700">{metadata.namespace || "—"}</div>
                                <p className="text-[10px] text-gray-400 mt-1">Grouping identifier to escape naming collisions</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Version</label>
                                <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-700">{metadata.version || "—"}</div>
                                <p className="text-[10px] text-gray-400 mt-1">Semantic versioning (e.g. 1.0.0)</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
                                <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700">{metadata.description || "—"}</div>
                                <p className="text-[10px] text-gray-400 mt-1">Human-readable description of what the tool does</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">URL Match Patterns</label>
                                <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-xs text-gray-700 bg-gray-50">
                                    {(() => {
                                        const patterns = metadata.allowedDomains;
                                        if (!patterns) return "—";
                                        if (Array.isArray(patterns)) {
                                            return patterns.join(', ');
                                        }
                                        return String(patterns).replace(/[[\]"]/g, '');
                                    })()}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Patterns of URLs where this tool can execute</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Input Schema</label>
                                <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-xs text-gray-700 whitespace-pre-wrap">
                                    {(() => {
                                        const schema = metadata.inputSchema;
                                        if (!schema) return "—";
                                        if (typeof schema === 'string') return schema;
                                        return JSON.stringify(schema, null, 2);
                                    })()}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">JSON Schema defining the arguments the tool accepts</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="validation" className="m-0 p-0 border-0 bg-transparent space-y-4">
                    <div className={`border rounded p-4 ${validationState === 'valid' ? 'bg-green-50 border-green-200' : validationState === 'invalid' ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                        {validationState === 'idle' && <span className="text-gray-500 text-sm">Not yet validated.</span>}
                        {validationState === 'valid' && (
                            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                                <CheckIcon size={16} /> Valid Structure
                            </div>
                        )}
                        {validationState === 'invalid' && (
                            <div className="flex items-start gap-2 text-red-700 text-sm font-medium">
                                <AlertCircleIcon size={16} className="mt-0.5" />
                                <span>{errorMsg}</span>
                            </div>
                        )}
                    </div>

                    <Button className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 gap-2" onClick={onValidate}>
                        <PlayIcon size={16} /> Validate Syntax
                    </Button>

                </TabsContent>
            </div>
        </Tabs>
    );
}
