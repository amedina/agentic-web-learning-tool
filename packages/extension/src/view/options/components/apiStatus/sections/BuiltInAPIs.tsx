
import { useState, useEffect } from 'react';
import StatusCard from '../components/StatusCard';
import StatusItem from '../components/StatusItem';
import StatusIndicator, { type StatusType } from '../components/StatusIndicator';
import { Button } from '@google-awlt/design-system';
import { RefreshCw } from 'lucide-react';

interface APIInfo {
  id: string;
  name: string;
  flag: string;
}

const APIS: APIInfo[] = [
  { id: 'prompt', name: 'Prompt API', flag: '#prompt-api-for-built-in-ai' },
  { id: 'proofreader', name: 'Proofreader API', flag: '#proofreader-api-for-built-in-ai' }, // Guessing flag name, usually they follow pattern
  { id: 'translator', name: 'Translator API', flag: '#translation-api' },
  { id: 'languageDetector', name: 'Language Detector API', flag: '#language-detection-api' },
  { id: 'summarizer', name: 'Summarizer API', flag: '#summarization-api-for-built-in-ai' },
  { id: 'writer', name: 'Writer API', flag: '#writer-api-for-built-in-ai' },
  { id: 'rewriter', name: 'Rewriter API', flag: '#rewriter-api-for-built-in-ai' },
];

export default function BuiltInAPIs() {
  const [statuses, setStatuses] = useState<Record<string, { status: StatusType; label: string }>>({});

  const checkAPI = async (api: APIInfo) => {
    let status: StatusType = 'error';
    let label = 'Not Available';

    try {
        let available: string | undefined;

        // Helper to check availability
        const check = async (obj: any) => {
            if (!obj) return null;
            if (typeof obj.capabilities === 'function') {
                const caps = await obj.capabilities();
                return caps.available; // 'readily', 'after-download', 'no'
            }
            if (typeof obj.availability === 'function') {
                return await obj.availability(); // 'readily', 'after-download', 'no'
            }
            // Fallback for some APIs that might just exist as constructor but have no static availability check yet?
            // Usually capabilities() is the standard now.
            return null;
        };

        // Specific checks based on API ID
        if (api.id === 'prompt') {
            if (window.ai?.languageModel) {
                 available = await check(window.ai.languageModel);
            }
        } else if (api.id === 'proofreader') {
             // window.ai.proofreader or window.Proofreader
             if (window.ai?.proofreader) available = await check(window.ai.proofreader);
             else if (window.Proofreader) available = await check(window.Proofreader);
        } else if (api.id === 'translator') {
             if (window.ai?.translator) available = await check(window.ai.translator);
             else if (window.Translator) available = await check(window.Translator);
             else if (window.translation) available = await check(window.translation);
        } else if (api.id === 'languageDetector') {
             if (window.ai?.languageDetector) available = await check(window.ai.languageDetector);
             else if (window.LanguageDetector) available = await check(window.LanguageDetector);
        } else if (api.id === 'summarizer') {
             if (window.ai?.summarizer) available = await check(window.ai.summarizer);
             else if (window.Summarizer) available = await check(window.Summarizer);
        } else if (api.id === 'writer') {
             if (window.ai?.writer) available = await check(window.ai.writer);
             else if (window.Writer) available = await check(window.Writer);
        } else if (api.id === 'rewriter') {
             if (window.ai?.rewriter) available = await check(window.ai.rewriter);
             else if (window.Rewriter) available = await check(window.Rewriter);
        }

        if (available === 'readily') {
            status = 'ready';
            label = 'Available';
        } else if (available === 'after-download') {
            status = 'warning';
            label = 'Downloading';
        } else if (available === 'no') {
            status = 'error';
            label = 'Not Available';
        } else {
             // If we found the object but couldn't check availability, usually means it's there but maybe old version?
             // Or if check returned null.
             if (status === 'error' && available === undefined) {
                 // Check constructors existence as fallback
                 const constructorName = api.id.charAt(0).toUpperCase() + api.id.slice(1);
                 // Special cases
                 if (api.id === 'prompt' && window.ai?.languageModel) { status = 'ready'; label = 'Available (No caps)'; }
                 // @ts-ignore
                 else if (window[constructorName]) { status = 'ready'; label = 'Available (Constructor)'; }
             }
        }

    } catch (e) {
        console.error(`Error checking ${api.id}`, e);
    }

    setStatuses(prev => ({ ...prev, [api.id]: { status, label } }));
  };

  const checkAll = () => {
    APIS.forEach(checkAPI);
  };

  useEffect(() => {
    checkAll();
  }, []);

  return (
    <StatusCard
        title="In-Built AI APIs"
        description="Status of specific Chrome AI Primitives available to the browser."
        headerAction={
             <Button variant="ghost" size="icon" onClick={checkAll} title="Refresh">
                <RefreshCw className="w-4 h-4" />
            </Button>
        }
    >
      {APIS.map(api => {
        const info = statuses[api.id] || { status: 'loading', label: 'Checking...' };
        return (
            <StatusItem
                key={api.id}
                label={api.name}
                action={
                    info.status === 'error' ? (
                        <button
                            onClick={() => chrome.tabs.create({ url: `chrome://flags/${api.flag}` })}
                            className="text-xs text-blue-500 hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                            Enable Flag
                        </button>
                    ) : info.status === 'warning' ? (
                         <span className="text-xs text-muted-foreground">Check connection</span>
                    ) : null
                }
            >
                <StatusIndicator status={info.status} label={info.label} />
                {info.status === 'warning' && (
                     <div className="w-full bg-secondary h-1 mt-2 rounded overflow-hidden">
                        <div className="bg-blue-500 h-full w-1/2 animate-pulse"></div>
                     </div>
                )}
            </StatusItem>
        );
      })}
    </StatusCard>
  );
}
