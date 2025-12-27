/**
 * External dependencies.
 */
import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckIcon, AlertTriangleIcon, CopyIcon, TrashIcon, LayoutTemplateIcon, SaveIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import type { WebMCPTool } from '../types';
import { ExtractMetadata } from './extractMetadata';
import { validateCode } from './validateCode';
import { MetadataPanel } from './metadataPanel';
import { CodeEditor } from './codeEditor';

interface EditToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tool?: WebMCPTool;
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

export function EditToolDialog({ open, onOpenChange, tool, onSave, onDelete }: EditToolDialogProps) {
    const [code, setCode] = useState(DEFAULT_SCRIPT_TEMPLATE);
    const [initialCode, setInitialCode] = useState(DEFAULT_SCRIPT_TEMPLATE);
    const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState('metadata');
    const [isCopied, setIsCopied] = useState(false);

    const [showTemplateWarning, setShowTemplateWarning] = useState(false);

    useEffect(() => {
        if (open) {
            if (tool?.code) {
                setCode(tool.code);
                setInitialCode(tool.code);
            } else {
                setCode(DEFAULT_SCRIPT_TEMPLATE);
                setInitialCode(DEFAULT_SCRIPT_TEMPLATE);
            }
            setValidationState('idle');
            setErrorMsg('');
            setActiveTab('metadata');
            setShowTemplateWarning(false);
            setIsCopied(false);
        }
    }, [open, tool]);

    const handleInsertTemplateRequest = () => {
        if (!code.trim() || code === DEFAULT_SCRIPT_TEMPLATE) {
            setCode(DEFAULT_SCRIPT_TEMPLATE);
            return;
        }
        setShowTemplateWarning(true);
    };

    const confirmInsertTemplate = () => {
        setCode(DEFAULT_SCRIPT_TEMPLATE);
        setShowTemplateWarning(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
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
        const validation = validateCode(code);

        if (!validation.valid) {
            setValidationState('invalid');
            setErrorMsg(validation.error || 'Validation failed');
            setActiveTab('validation');
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

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        setValidationState('idle');
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
                            <Button
                                size="sm"
                                variant="outline"
                                className={`bg-white h-8 text-xs font-medium gap-1.5 ${code === initialCode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleInsertTemplateRequest}
                                disabled={code === initialCode}
                            >
                                <LayoutTemplateIcon size={12} /> Insert Template
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className={`bg-white h-8 text-xs font-medium gap-1.5 ${!code?.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleCopy}
                                disabled={!code?.trim()}
                            >
                                {isCopied ? <CheckIcon size={12} className="text-green-600" /> : <CopyIcon size={12} />}
                                {isCopied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>

                        {/* Template Warning Toast/Overlay */}
                        {showTemplateWarning && (
                            <div className="absolute top-16 left-4 right-[420px] z-30 mx-auto w-max max-w-[90%]">
                                <div className="bg-gray-900/95 text-white p-3 rounded-lg shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 border border-gray-700">
                                    <AlertTriangleIcon className="text-yellow-400" size={16} />
                                    <span className="text-sm font-medium">Overwriting code with template. Are you sure?</span>
                                    <div className="flex gap-2 ml-2">
                                        <button
                                            onClick={confirmInsertTemplate}
                                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                                        >
                                            Overwrite
                                        </button>
                                        <button
                                            onClick={() => setShowTemplateWarning(false)}
                                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Editor Side */}
                        <div className="flex-1 flex flex-col p-0 border-r border-gray-200 relative bg-white overflow-auto">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Script Code
                            </div>
                            <CodeEditor code={code} onChange={handleCodeChange} />
                        </div>

                        {/* Sidebar/Metadata Side */}
                        <div className="w-[400px] bg-gray-50 flex flex-col overflow-hidden">
                            <MetadataPanel
                                code={code}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                validationState={validationState}
                                errorMsg={errorMsg}
                                onValidate={handleValidate}
                            />

                            {/* Footer Buttons */}
                            <div className="p-6 border-t border-gray-200 bg-white flex-none flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    {tool && onDelete && (
                                        <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2" onClick={() => onDelete(tool)}>
                                            <TrashIcon size={16} /> Delete
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Dialog.Close asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </Dialog.Close>
                                    <Button
                                        className={`${validationState === 'valid' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} ${code === initialCode ? 'opacity-50 cursor-not-allowed' : ''} gap-2`}
                                        onClick={handleSave}
                                        disabled={code === initialCode}
                                    >
                                        <SaveIcon size={16} /> Save Tool
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
