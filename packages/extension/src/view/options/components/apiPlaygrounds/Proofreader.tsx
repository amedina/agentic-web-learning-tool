import { useState, useEffect } from 'react';
import {
  CheckCheck,
  Loader2,
  AlertCircle,
  Copy,
  Sparkles,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import {
  Button,
  Textarea,
  Label,
  Toaster,
  toast,
  Checkbox
} from '@google-awlt/design-system';

import type {
    AIProofreader,
    AIProofreaderResult
} from '../../../../types/window.ai';

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ru', name: 'Russian' }
];

export default function Proofreader() {
    // Capability State
    const [capabilityStatus, setCapabilityStatus] = useState<'readily' | 'after-download' | 'no'>('no');
    const [isChecking, setIsChecking] = useState(true);

    // Configuration State
    const [inputLanguages, setInputLanguages] = useState<string[]>(['en']);

    // Input/Output State
    const [input, setInput] = useState('');
    const [result, setResult] = useState<AIProofreaderResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        pollForCapabilities(5, 1000);
    }, []);

    const pollForCapabilities = async (attempts: number, delay: number) => {
        let currentAttempt = 0;
        const check = async () => {
            currentAttempt++;
            try {
                if ((window as any).Proofreader || (window as any).ai?.proofreader) {
                    await checkCapabilities();
                    return;
                }

                if (currentAttempt < attempts) {
                    setTimeout(check, delay);
                } else {
                    // Final attempt
                    await checkCapabilities();
                }
            } catch (e) {
                if (currentAttempt < attempts) {
                     setTimeout(check, delay);
                }
            }
        };
        check();
    };

    const checkCapabilities = async () => {
        setIsChecking(true);
        try {
            let status: 'readily' | 'after-download' | 'no' = 'no';

            // Check Global Constructor (Origin Trial / Polyfill)
            if ((window as any).Proofreader) {
                // If the object exists, we assume it's usable unless explicitly told 'no'.
                status = 'readily';

                if (typeof (window as any).Proofreader.availability === 'function') {
                    try {
                        const avail = await (window as any).Proofreader.availability();
                        if (typeof avail === 'string') {
                            status = avail as any;
                        } else if (avail && typeof avail === 'object' && 'available' in avail) {
                             status = (avail as any).available;
                        }
                    } catch (err) {
                        console.warn('Proofreader.availability() failed, falling back to "readily"', err);
                    }
                }
            } else if ((window as any).ai?.proofreader) {
                // Check window.ai namespace (Standard/Future)
                const proofreaderFactory = (window as any).ai.proofreader;
                status = 'readily';

                if (typeof proofreaderFactory.capabilities === 'function') {
                     try {
                        const caps = await proofreaderFactory.capabilities();
                        status = caps.available;
                     } catch (err) {
                        console.warn('ai.proofreader.capabilities() failed', err);
                     }
                } else if (typeof proofreaderFactory.availability === 'function') {
                     try {
                        status = await proofreaderFactory.availability();
                     } catch (err) {
                        console.warn('ai.proofreader.availability() failed', err);
                     }
                }
            }

            setCapabilityStatus(status);
        } catch (e) {
            console.error('Error checking proofreader capabilities:', e);
            setCapabilityStatus('no');
        } finally {
            setIsChecking(false);
        }
    };

    const handleLanguageToggle = (langCode: string, checked: boolean) => {
        setInputLanguages(prev => {
            if (checked) {
                return [...prev, langCode];
            } else {
                return prev.filter(c => c !== langCode);
            }
        });
    };

    const handleProofread = async () => {
        if (!input.trim() || isProcessing) return;

        setError(null);
        setResult(null);
        setIsProcessing(true);

        let activeProofreader: AIProofreader | null = null;

        try {
            // Docs say `includeCorrectionTypes` and `includeCorrectionExplanations` are NOT supported.
            // Only expectedInputLanguages is passed.
            const options = {
                expectedInputLanguages: inputLanguages.length > 0 ? inputLanguages : ['en'],
            };

            if ((window as any).Proofreader) {
                activeProofreader = await (window as any).Proofreader.create(options);
            } else if ((window as any).ai?.proofreader) {
                activeProofreader = await (window as any).ai.proofreader.create(options);
            } else {
                throw new Error('Proofreader API not found');
            }

            if (!activeProofreader) {
                throw new Error('Failed to create Proofreader instance');
            }

            const proofreadResult = await activeProofreader.proofread(input);
            setResult(proofreadResult);

        } catch (err: any) {
            console.error('Proofreading failed:', err);
            setError(err.message || 'An error occurred during proofreading');
            toast.error('Proofreading Failed', { description: err.message });
        } finally {
            if (activeProofreader) {
                activeProofreader.destroy();
            }
            setIsProcessing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const needsDownload = capabilityStatus === 'after-download';
    const isAvailable = capabilityStatus !== 'no';

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] gap-6">
            <Toaster />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                {/* Configuration Panel */}
                <div className="md:col-span-1 flex flex-col gap-4">
                     <div className="bg-card border rounded-xl p-4 space-y-4 flex flex-col h-full max-h-[600px]">
                        <div className="flex items-center gap-2 font-medium flex-shrink-0">
                            <Settings2 className="w-4 h-4" />
                            <span>Configuration</span>
                        </div>

                        {/* Options */}
                        <div className="space-y-4 pt-2 flex-1 flex flex-col min-h-0">
                            <div className="space-y-2 flex flex-col flex-1 min-h-0">
                                <Label>Input Languages</Label>
                                <p className="text-xs text-muted-foreground">Select all that apply</p>
                                <div className="border rounded-md p-2 overflow-y-auto flex-1 bg-background">
                                    <div className="space-y-2">
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <div key={`lang-${lang.code}`} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`lang-${lang.code}`}
                                                    checked={inputLanguages.includes(lang.code)}
                                                    onCheckedChange={(checked) => handleLanguageToggle(lang.code, checked === true)}
                                                />
                                                <label
                                                    htmlFor={`lang-${lang.code}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {lang.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>

                     {/* Status Card */}
                     <div className="bg-muted/30 border rounded-xl p-4 space-y-3 flex-shrink-0">
                         <h4 className="text-sm font-medium flex items-center gap-2">
                             <Sparkles className="w-3 h-3 text-primary" />
                             Model Status
                         </h4>
                         <div className="flex items-center justify-between text-sm">
                             <span>Proofreader API:</span>
                             {isChecking ? (
                                 <Loader2 className="w-3 h-3 animate-spin" />
                             ) : (
                                <StatusBadge status={capabilityStatus} />
                             )}
                         </div>
                     </div>
                </div>

                {/* Workspace Panel */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    {/* Input Area */}
                    <div className="bg-card border rounded-xl p-4 flex flex-col gap-4 min-h-[200px]">
                         <div className="flex justify-between items-center">
                            <Label className="text-base">Text to Proofread</Label>
                            {!isAvailable && !isChecking && (
                                <span className="flex items-center gap-1 text-destructive text-xs bg-destructive/10 px-2 py-1 rounded-full">
                                    <AlertCircle className="w-3 h-3" /> API Not Available
                                </span>
                            )}
                         </div>
                         <Textarea
                            className="flex-1 resize-none font-mono text-sm leading-relaxed min-h-[120px]"
                            placeholder="Type or paste text here to check for grammar and spelling errors..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                         />
                         <div className="flex justify-end">
                             <Button
                                onClick={handleProofread}
                                disabled={!input.trim() || isProcessing || !isAvailable}
                                className="w-full sm:w-auto"
                             >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Checking...
                                    </>
                                ) : needsDownload ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Initialize & Check
                                    </>
                                ) : (
                                    <>
                                        <CheckCheck className="w-4 h-4 mr-2" />
                                        Check Text
                                    </>
                                )}
                             </Button>
                         </div>
                    </div>

                    {/* Output Area */}
                    <div className="flex-1 bg-card border rounded-xl p-4 flex flex-col gap-4 min-h-[300px] overflow-hidden">
                        <div className="flex justify-between items-center border-b pb-2">
                            <Label className="text-base flex items-center gap-2">
                                <CheckCheck className="w-4 h-4" /> Results
                            </Label>
                            {result && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(result.correctedInput)}
                                    disabled={!result.correctedInput}
                                    className="h-8"
                                >
                                    <Copy className="w-3 h-3 mr-2" /> Copy Corrected
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto space-y-4">
                            {result ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Corrected Text</Label>
                                        <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                                            {result.correctedInput}
                                        </div>
                                    </div>

                                    {result.corrections.length > 0 ? (
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                                Corrections Found ({result.corrections.length})
                                            </Label>
                                            <div className="grid gap-3">
                                                {result.corrections.map((correction, idx) => (
                                                    <div key={idx} className="border rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-primary">
                                                                    "{input.substring(correction.startIndex, correction.endIndex)}"
                                                                </span>
                                                                <span className="text-muted-foreground">→</span>
                                                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                                    "{correction.correction}"
                                                                </span>
                                                            </div>
                                                            {correction.type && (
                                                                <span className="text-[10px] uppercase font-bold text-muted-foreground border px-1.5 py-0.5 rounded">
                                                                    {correction.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {correction.explanation && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {correction.explanation}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 p-4 bg-green-500/10 rounded-lg">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <p className="font-medium">No errors found. Good job!</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                                    {error ? (
                                        <div className="text-destructive flex flex-col items-center gap-2">
                                            <AlertCircle className="w-8 h-8" />
                                            <p className="text-center">{error}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCheck className="w-8 h-8 mb-2 opacity-20" />
                                            <p>Proofreading results will appear here</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'readily') {
        return <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium">Ready</span>;
    }
    if (status === 'after-download') {
        return <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full font-medium">Download Req.</span>;
    }
    return <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Unavailable</span>;
}
