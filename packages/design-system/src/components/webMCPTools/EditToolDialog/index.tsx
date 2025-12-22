/**
 * External dependencies.
 */
import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, PlayIcon, CheckIcon, AlertCircleIcon, TrashIcon, FileCodeIcon, LayoutTemplateIcon, SaveIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import SyntaxHighlighter from './syntaxHighlighter';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../tabs';
import type { WebMCPTool } from '../types';

interface EditToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tool?: WebMCPTool; // If undefined, creating new
    onSave: (tool: WebMCPTool) => void;
    onDelete?: (tool: WebMCPTool) => void;
}

const DEFAULT_SCRIPT_TEMPLATE = `export const metadata = {
  name: "new_tool",
  namespace: "user_scripts",
  version: "1.0.0",
  description: "Description of your tool",
  match: ["<all_urls>"],
  inputSchema: {
    type: "object",
    properties: {}, 
    additionalProperties: false
  }
};

export async function execute(args) {
  // Your code here
  console.log("Executing tool with args:", args);
  return "Tool executed successfully";
}
`;

function ExtractMetadata(code: string): Partial<WebMCPTool> {
    const metadata: any = {};
    try {
        // Safe regex parsing
        const nameMatch = code.match(/name:\s*["']([^"']+)["']/);
        if (nameMatch) metadata.name = nameMatch[1];

        const nsMatch = code.match(/namespace:\s*["']([^"']+)["']/);
        if (nsMatch) metadata.namespace = nsMatch[1];

        const versionMatch = code.match(/version:\s*["']([^"']+)["']/);
        if (versionMatch) metadata.version = versionMatch[1];

        const descMatch = code.match(/description:\s*["']([^"']+)["']/);
        if (descMatch) metadata.description = descMatch[1];

        // Extract match patterns (simple array regex)
        const matchPatternsMatch = code.match(/match:\s*(\[[^\]]+\])/);
        if (matchPatternsMatch) {
            try {
                // Be careful with eval-like behavior, but JSON.parse might fail on single quotes.
                // Let's just store the string for display if parsing fails, or try a safe replace
                const arrayStr = matchPatternsMatch[1].replace(/'/g, '"');
                metadata.matchPatterns = JSON.parse(arrayStr);
            } catch (e) {
                metadata.matchPatterns = [matchPatternsMatch[1]]; // Fallback string
            }
        }

        // Extract inputSchema (block match)
        const schemaMatch = code.match(/inputSchema:\s*({[\s\S]*?})\s*}/);
        if (schemaMatch) {
            // Just keeping the string representation for UI is often safer/easier for preview
            // We can try to format it slightly
            metadata.inputSchema = schemaMatch[1];
        }

    } catch (e) {
        console.warn("Failed to extract metadata", e);
    }
    return metadata;
}

export function EditToolDialog({ open, onOpenChange, tool, onSave, onDelete }: EditToolDialogProps) {
    const [code, setCode] = useState(DEFAULT_SCRIPT_TEMPLATE);
    const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState('metadata');

    useEffect(() => {
        if (open) {
            if (tool?.code) {
                setCode(tool.code);
            } else {
                setCode(DEFAULT_SCRIPT_TEMPLATE);
            }
            setValidationState('idle');
            setErrorMsg('');
            setActiveTab('metadata');
        }
    }, [open, tool]);

    const validateCode = (currentCode: string): { valid: boolean; error?: string } => {
        try {
            const hasMetadata = /export\s+const\s+metadata\s*=\s*{/.test(currentCode);
            // Use word boundary \b to ensure we match 'execute' exactly, not 'executeStupid'
            const hasExecute = /export\s+async\s+function\s+execute\b/.test(currentCode);

            if (!hasMetadata) throw new Error("Missing 'export const metadata = { ... }'");
            if (!hasExecute) throw new Error("Missing 'export async function execute(args) { ... }'");

            // Extract and validate required metadata fields
            const tempMetadata = ExtractMetadata(currentCode);
            if (!tempMetadata.name) throw new Error("Metadata must contain a 'name' field.");
            if (!tempMetadata.inputSchema) throw new Error("Metadata must contain an 'inputSchema' field.");

            // Simple brace balance check
            let balance = 0;
            for (const char of currentCode) {
                if (char === '{') balance++;
                if (char === '}') balance--;
            }
            if (balance !== 0) throw new Error("Unbalanced curly braces. Check your syntax.");

            return { valid: true };
        } catch (e: any) {
            return { valid: false, error: e.message };
        }
    };

    const handleValidate = () => {
        const result = validateCode(code);
        if (result.valid) {
            setValidationState('valid');
            setErrorMsg('');
        } else {
            setValidationState('invalid');
            setErrorMsg(result.error || 'Unknown error');
        }
    };

    const handleSave = () => {
        // Run validation on save attempt
        const validation = validateCode(code);

        if (!validation.valid) {
            setValidationState('invalid');
            setErrorMsg(validation.error || 'Validation failed');
            setActiveTab('validation'); // Switch to validation tab so user sees error
            return;
        }

        const extracted = ExtractMetadata(code);

        const newTool: WebMCPTool = {
            name: extracted.name || tool?.name || "new_tool",
            namespace: extracted.namespace || tool?.namespace || "user_scripts",
            version: extracted.version || tool?.version || "1.0.0",
            description: extracted.description || tool?.description || "No description",
            matchPatterns: Array.isArray(extracted.matchPatterns) ? extracted.matchPatterns : ["<all_urls>"],
            inputSchema: typeof extracted.inputSchema === 'string' ? {} : (extracted.inputSchema || {}),
            code: code,
            enabled: tool ? tool.enabled : true,
            isBuiltIn: false
        };
        onSave(newTool);
        onOpenChange(false);
    };

    // EDITOR CONFIG
    const editorFontFamily = '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace';
    const editorFontSize = '14px';
    const editorLineHeight = '1.5';
    const editorPadding = '1.5rem 1rem';

    // Cast to any to allow style prop which is missing in types but valid in runtime
    const SyntaxHighlighterAny = SyntaxHighlighter as any;

    const backdropRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (backdropRef.current) {
            backdropRef.current.scrollTop = e.currentTarget.scrollTop;
            backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] h-[90vh] bg-white text-gray-900 border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center gap-3">
                            <Dialog.Title className="text-lg font-bold">
                                {tool ? 'Edit WebMCP Script' : 'New WebMCP Script'}
                            </Dialog.Title>
                        </div>
                        <Dialog.Close asChild>
                            <button className="text-gray-500 hover:text-gray-900 transition-colors">
                                <X size={20} />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="flex-grow flex flex-row overflow-hidden relative">
                        {/* Toolbar overlay for editor */}
                        <div className="absolute top-4 right-[420px] z-20 flex gap-2">
                            <Button size="sm" variant="outline" className="bg-white h-8 text-xs font-medium" onClick={() => setCode(DEFAULT_SCRIPT_TEMPLATE)}>
                                <LayoutTemplateIcon size={12} className="mr-1.5" /> Insert Template
                            </Button>
                            <Button size="sm" variant="outline" className="bg-white h-8 text-xs font-medium" disabled>
                                <FileCodeIcon size={12} className="mr-1.5" /> Format
                            </Button>
                        </div>

                        {/* Editor Side */}
                        <div className="flex-1 flex flex-col p-0 border-r border-gray-200 relative bg-white">
                            {/* Header for Code section */}
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Script Code
                            </div>

                            <div className="flex-1 relative">
                                <textarea
                                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-black z-10 resize-none outline-none border-none focus:ring-0 whitespace-nowrap overflow-auto"
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        setValidationState('idle'); // Invalidate on change
                                    }}
                                    onScroll={handleScroll}
                                    spellCheck={false}
                                    style={{
                                        fontFamily: editorFontFamily,
                                        fontSize: editorFontSize,
                                        lineHeight: editorLineHeight,
                                        padding: editorPadding,
                                        whiteSpace: 'pre', // CRITICAL for alignment
                                    }}
                                />
                                <div
                                    ref={backdropRef}
                                    className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-white"
                                >
                                    {/* @ts-ignore */}
                                    <SyntaxHighlighterAny
                                        language="javascript"
                                        code={code}
                                        components={{
                                            Pre: (props: any) => <pre {...props} style={{ margin: 0, minHeight: '100%', fontFamily: editorFontFamily, fontSize: editorFontSize, lineHeight: editorLineHeight, padding: editorPadding, backgroundColor: 'white' }} />,
                                            Code: (props: any) => <code {...props} style={{ fontFamily: 'inherit' }} />,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar/Metadata Side */}
                        <div className="w-[400px] bg-gray-50 flex flex-col overflow-hidden">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
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
                                                    <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-700">{ExtractMetadata(code).name || "—"}</div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Namespace</label>
                                                    <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-700">{ExtractMetadata(code).namespace || "—"}</div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Version</label>
                                                    <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-700">{ExtractMetadata(code).version || "—"}</div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
                                                    <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700">{ExtractMetadata(code).description || "—"}</div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">URL Match Patterns</label>
                                                    <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-xs text-gray-700 bg-gray-50">
                                                        {JSON.stringify(ExtractMetadata(code).matchPatterns, null, 2) || (ExtractMetadata(code).matchPatterns ? String(ExtractMetadata(code).matchPatterns) : "—")}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Input Schema</label>
                                                    <div className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-xs text-gray-700 whitespace-pre-wrap">
                                                        {(() => {
                                                            const schema = ExtractMetadata(code).inputSchema;
                                                            if (!schema) return "—";
                                                            if (typeof schema === 'string') return schema;
                                                            return JSON.stringify(schema, null, 2);
                                                        })()}
                                                    </div>
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

                                        <Button className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={handleValidate}>
                                            <PlayIcon size={16} className="mr-2" /> Validate Syntax
                                        </Button>

                                    </TabsContent>
                                </div>
                            </Tabs>

                            {/* Footer Buttons - Save always visible now (disabled if invalid), Delete always visible for existing */}
                            <div className="p-6 border-t border-gray-200 bg-white flex-none flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    {tool && onDelete && (
                                        <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(tool)}>
                                            <TrashIcon size={16} className="mr-2" /> Delete
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Dialog.Close asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </Dialog.Close>
                                    <Button
                                        className={`${validationState === 'valid' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                        onClick={handleSave}
                                    >
                                        <SaveIcon size={16} className="mr-2" /> Save Tool
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
