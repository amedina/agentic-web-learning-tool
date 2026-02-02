import { useState, useEffect } from 'react';
import {
  Languages,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  Copy,
  Globe,
  Download
} from 'lucide-react';
import {
  Button,
  Textarea,
  Label,
  Toaster,
  toast,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger
} from '@google-awlt/design-system';

import type {
    AILanguageDetector,
    AITranslator,
    AIAvailability
} from '../../types/window.ai';

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'ja', name: 'Japanese' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'it', name: 'Italian' },
    { code: 'ko', name: 'Korean' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' }
];

export default function PolyglotPanel() {
    // Mode State
    const [mode, setMode] = useState<'detector' | 'translator'>('detector');

    // Capabilities State
    const [detectorStatus, setDetectorStatus] = useState<AIAvailability>('no');
    const [translatorStatus, setTranslatorStatus] = useState<AIAvailability | 'unchecked'>('unchecked');
    const [isChecking, setIsChecking] = useState(false);

    // Detector State
    const [detectInput, setDetectInput] = useState('');
    const [detectedResults, setDetectedResults] = useState<{ detectedLanguage: string; confidence: number }[]>([]);
    const [isDetecting, setIsDetecting] = useState(false);

    // Translator State
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('es');
    const [translateInput, setTranslateInput] = useState('');
    const [translateOutput, setTranslateOutput] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationError, setTranslationError] = useState<string | null>(null);

    // Initial check for Detector
    useEffect(() => {
        checkDetectorCapability();

        // Poll for capability changes (e.g. if model finishes downloading or injection happens)
        const intervalId = setInterval(checkDetectorCapability, 3000);
        return () => clearInterval(intervalId);
    }, []);

    // Check Translator capability when pair changes
    useEffect(() => {
        if (mode === 'translator') {
            checkTranslatorCapability();
        }
    }, [mode, sourceLang, targetLang]);

    const checkDetectorCapability = async () => {
        try {
            if (window.LanguageDetector) {
                 if (typeof window.LanguageDetector.availability === 'function') {
                    // @ts-ignore
                    const status = await window.LanguageDetector.availability();
                    setDetectorStatus(status);
                    return;
                 }
                 // If create exists but no availability check, assume readily for now or try create
                 setDetectorStatus('readily');
            } else if (window.ai?.languageDetector) {
                // Check for different potential API shapes
                if (typeof window.ai.languageDetector.availability === 'function') {
                     const status = await window.ai.languageDetector.availability();
                     setDetectorStatus(status);
                } else if (typeof window.ai.languageDetector.capabilities === 'function') {
                     const caps = await window.ai.languageDetector.capabilities();
                     setDetectorStatus(caps?.available || 'no');
                } else {
                     // Fallback: if we can't check, assume 'no' until proven otherwise by 'create'
                     // OR check if 'create' exists
                     setDetectorStatus('no');
                }
            } else {
                setDetectorStatus('no');
            }
        } catch (e) {
            console.error('Error checking detector capabilities:', e);
            setDetectorStatus('no');
        }
    };

    const checkTranslatorCapability = async () => {
        if (sourceLang === 'auto') {
            // Cannot check specific pair availability if source is auto
            // We assume 'readily' effectively, or we could force user to select source.
            // But usually the API requires a specific pair.
            // If source is auto, we might defer check until run time (detect first).
            setTranslatorStatus('readily'); // Optimistic
            return;
        }

        setIsChecking(true);
        try {
            const pair = { sourceLanguage: sourceLang, targetLanguage: targetLang };
            if (window.Translator) {
                 const status = await window.Translator.availability(pair);
                 setTranslatorStatus(status);
            } else if (window.translation) {
                 const status = await window.translation.availability(pair);
                 setTranslatorStatus(status);
            } else {
                setTranslatorStatus('no');
            }
        } catch (e) {
            console.error('Error checking translator capabilities:', e);
            setTranslatorStatus('no');
        } finally {
            setIsChecking(false);
        }
    };

    const handleDetect = async () => {
        if (!detectInput.trim()) return;
        setIsDetecting(true);
        setDetectedResults([]);

        try {
            let detector: AILanguageDetector;
            if (window.LanguageDetector) {
                detector = await window.LanguageDetector.create();
            } else if (window.ai?.languageDetector) {
                detector = await window.ai.languageDetector.create();
            } else {
                throw new Error('Language Detector API not found');
            }

            const results = await detector.detect(detectInput);
            setDetectedResults(results);

            // If successful, update status to readily
            setDetectorStatus('readily');

        } catch (e: any) {
            console.error('Detection failed:', e);
            toast.error('Detection Failed', { description: e.message });
        } finally {
            setIsDetecting(false);
        }
    };

    const handleTranslate = async () => {
        if (!translateInput.trim()) return;
        setIsTranslating(true);
        setTranslateOutput('');
        setTranslationError(null);

        let activeTranslator: AITranslator | null = null;

        try {
            let finalSourceLang = sourceLang;

            // 1. Auto-detect if needed
            if (sourceLang === 'auto') {
                let detector: AILanguageDetector;
                if (window.LanguageDetector) {
                    detector = await window.LanguageDetector.create();
                } else if (window.ai?.languageDetector) {
                    detector = await window.ai.languageDetector.create();
                } else {
                    throw new Error('Language Detector API not found for auto-detection');
                }
                const results = await detector.detect(translateInput);
                if (results.length > 0) {
                    finalSourceLang = results[0].detectedLanguage;
                    toast.message(`Detected Source: ${getLanguageName(finalSourceLang)}`);
                } else {
                    throw new Error('Could not auto-detect source language');
                }
            }

            // 2. Create Translator
            const options = {
                sourceLanguage: finalSourceLang,
                targetLanguage: targetLang
            };

            // Double check availability for this specific pair now that we have source
            if (sourceLang === 'auto') {
                 // We didn't check before because we didn't know the source
                 let status = 'no';
                 if (window.Translator) {
                     status = await window.Translator.availability(options);
                 } else if (window.translation) {
                     status = await window.translation.availability(options);
                 }

                 if (status === 'no') {
                     throw new Error(`Translation from ${finalSourceLang} to ${targetLang} is not supported.`);
                 }
                 if (status === 'after-download') {
                     // In a real app we might prompt user here, but for now we proceed which triggers download
                     toast.message('Downloading translation model...');
                 }
            }

            if (window.Translator) {
                activeTranslator = await window.Translator.create(options);
            } else if (window.translation) {
                activeTranslator = await window.translation.create(options);
            } else {
                throw new Error('Translator API not found');
            }

            // 3. Translate
            if (activeTranslator.translateStreaming) {
                const stream = activeTranslator.translateStreaming(translateInput);
                for await (const chunk of stream) {
                    setTranslateOutput(chunk);
                }
            } else {
                // Fallback to non-streaming
                const result = await activeTranslator.translate(translateInput);
                setTranslateOutput(result);
            }

        } catch (e: any) {
            console.error('Translation failed:', e);
            setTranslationError(e.message || 'Translation failed');
            toast.error('Translation Error', { description: e.message });
        } finally {
            setIsTranslating(false);
            // We usually don't destroy translator immediately if we want to reuse,
            // but the example shows ephemeral usage.
            // Also no explicit `destroy` method on Translator interface in my d.ts?
            // Actually Writer has destroy, Translator might not in standard spec yet?
            // I'll leave it open.
        }
    };

    const getLanguageName = (code: string) => {
        try {
            const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
            return displayNames.of(code);
        } catch (e) {
            return code;
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] gap-6 w-full">
            <Toaster />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Configuration Panel */}
                <div className="md:col-span-1 flex flex-col gap-4">
                     <div className="bg-card border rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 font-medium">
                            <Globe className="w-4 h-4" />
                            <span>API Selection</span>
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-2">
                             <Label>Operation Mode</Label>
                             <Tabs value={mode} onValueChange={(v) => setMode(v as 'detector' | 'translator')} className="w-full">
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="detector" className="flex items-center gap-2">
                                        <Languages className="w-3 h-3" /> Language Detector
                                    </TabsTrigger>
                                    <TabsTrigger value="translator" className="flex items-center gap-2">
                                        <ArrowRight className="w-3 h-3" /> Translator
                                    </TabsTrigger>
                                </TabsList>
                             </Tabs>
                        </div>

                        {/* Translator Options */}
                        {mode === 'translator' && (
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Source Language</Label>
                                    <Select value={sourceLang} onValueChange={setSourceLang}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">Auto-Detect</SelectItem>
                                            {SUPPORTED_LANGUAGES.map((lang) => (
                                                <SelectItem key={`source-${lang.code}`} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Target Language</Label>
                                    <Select value={targetLang} onValueChange={setTargetLang}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select target" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_LANGUAGES.map((lang) => (
                                                <SelectItem key={`target-${lang.code}`} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                     </div>

                     {/* Status Card */}
                     <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
                         <h4 className="text-sm font-medium flex items-center gap-2">
                             <Sparkles className="w-3 h-3 text-primary" />
                             API Status
                         </h4>
                         {mode === 'detector' ? (
                             <div className="flex items-center justify-between text-sm">
                                 <span>Language Detector:</span>
                                 <StatusBadge status={detectorStatus} />
                             </div>
                         ) : (
                             <div className="space-y-2">
                                 <div className="flex items-center justify-between text-sm">
                                     <span>Translator Pair:</span>
                                     {isChecking ? (
                                         <Loader2 className="w-3 h-3 animate-spin" />
                                     ) : (
                                        <StatusBadge status={translatorStatus} />
                                     )}
                                 </div>
                                 <p className="text-xs text-muted-foreground">
                                    {sourceLang === 'auto'
                                        ? "Specific pair availability will be checked upon detection."
                                        : `${getLanguageName(sourceLang)} → ${getLanguageName(targetLang)}`
                                    }
                                 </p>
                             </div>
                         )}
                     </div>
                </div>

                {/* Workspace Panel */}
                <div className="md:col-span-2 flex flex-col gap-4 h-full">
                    {/* Input Area */}
                    <div className="h-[250px] bg-card border rounded-xl p-4 flex flex-col gap-4 flex-shrink-0">
                         <div className="flex justify-between items-center flex-shrink-0">
                            <Label className="text-base">
                                Input Text
                            </Label>
                         </div>
                         <Textarea
                            className="flex-1 resize-none font-mono text-sm leading-relaxed"
                            placeholder={mode === 'detector' ? "Type or paste text to detect language..." : "Type text to translate..."}
                            value={mode === 'detector' ? detectInput : translateInput}
                            onChange={(e) => mode === 'detector' ? setDetectInput(e.target.value) : setTranslateInput(e.target.value)}
                         />
                         <div className="flex justify-end flex-shrink-0">
                             {mode === 'detector' ? (
                                 <Button
                                    onClick={handleDetect}
                                    disabled={!detectInput.trim() || isDetecting || detectorStatus === 'no' || detectorStatus === 'unavailable'}
                                 >
                                    {isDetecting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting...
                                        </>
                                    ) : (
                                        <>
                                            <Languages className="w-4 h-4 mr-2" /> Execute Detector API
                                        </>
                                    )}
                                 </Button>
                             ) : (
                                 <Button
                                    onClick={handleTranslate}
                                    disabled={!translateInput.trim() || isTranslating || translatorStatus === 'no' || translatorStatus === 'unavailable'}
                                 >
                                    {isTranslating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Translating...
                                        </>
                                    ) : (translatorStatus === 'after-download' || translatorStatus === 'downloadable') ? (
                                        <>
                                            <Download className="w-4 h-4 mr-2" /> Download & Translate
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="w-4 h-4 mr-2" /> Execute Translator API
                                        </>
                                    )}
                                 </Button>
                             )}
                         </div>
                    </div>

                    {/* Output Area */}
                    <div className="flex-[1.5] bg-card border rounded-xl p-4 flex flex-col gap-4 min-h-0 overflow-hidden">
                        <div className="flex justify-between items-center border-b pb-2 flex-shrink-0">
                            <Label className="text-base flex items-center gap-2">
                                {mode === 'detector' ? (
                                    <>
                                        <Languages className="w-4 h-4" /> Detected Language
                                    </>
                                ) : (
                                    <>
                                        <Globe className="w-4 h-4" /> Translation Result
                                    </>
                                )}
                            </Label>
                            {((mode === 'detector' && detectedResults.length > 0) || (mode === 'translator' && translateOutput)) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(mode === 'detector' ? JSON.stringify(detectedResults, null, 2) : translateOutput)}
                                    className="h-8"
                                >
                                    <Copy className="w-3 h-3 mr-2" /> Copy
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                            {mode === 'detector' ? (
                                detectedResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {detectedResults.map((result, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-card rounded border">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{getFlagEmoji(result.detectedLanguage)}</span>
                                                    <div>
                                                        <p className="font-semibold">{getLanguageName(result.detectedLanguage)}</p>
                                                        <p className="text-xs text-muted-foreground">Code: {result.detectedLanguage}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{(result.confidence * 100).toFixed(1)}%</p>
                                                    <p className="text-xs text-muted-foreground">Confidence</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                                        <Languages className="w-8 h-8 mb-2 opacity-20" />
                                        <p>Detector API output will appear here.</p>
                                    </div>
                                )
                            ) : (
                                translateOutput ? (
                                    <div className="text-base leading-relaxed">
                                        {translateOutput}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                                        {translationError ? (
                                            <div className="text-destructive flex flex-col items-center gap-2">
                                                <AlertCircle className="w-8 h-8" />
                                                <p className="text-center">{translationError}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Globe className="w-8 h-8 mb-2 opacity-20" />
                                                <p>Translator API output will appear here.</p>
                                            </>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'readily' || status === 'available') {
        return <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium">Ready</span>;
    }
    if (status === 'after-download' || status === 'downloadable') {
        return <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full font-medium">Download Required</span>;
    }
    if (status === 'downloading') {
        return <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-medium">Downloading...</span>;
    }
    if (status === 'unchecked') {
         return <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Unknown</span>;
    }
    return <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Unavailable</span>;
}

// Simple helper to guess flag emoji from language code (imperfect but visual)
function getFlagEmoji(langCode: string) {
    const code = langCode.split('-')[0];
    const map: Record<string, string> = {
        en: '🇺🇸', es: '🇪🇸', ja: '🇯🇵', fr: '🇫🇷', de: '🇩🇪',
        zh: '🇨🇳', hi: '🇮🇳', pt: '🇵🇹', ru: '🇷🇺', it: '🇮🇹',
        ko: '🇰🇷', tr: '🇹🇷', vi: '🇻🇳', nl: '🇳🇱', pl: '🇵🇱'
    };
    return map[code] || '🌐';
}
