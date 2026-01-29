
import { useState, useEffect } from 'react';
import StatusCard from '../components/StatusCard';
import StatusItem from '../components/StatusItem';
import StatusIndicator, { type StatusType } from '../components/StatusIndicator';
import { Button } from '@google-awlt/design-system';
import { RefreshCw, Download } from 'lucide-react';

interface APIInfo {
  id: string;
  name: string;
  flag: string;
}

const APIS: APIInfo[] = [
  { id: 'prompt', name: 'Prompt API', flag: '#prompt-api-for-gemini-nano' },
  { id: 'proofreader', name: 'Proofreader API', flag: '#proofreader-api-for-gemini-nano' },
  { id: 'translator', name: 'Translator API', flag: '#translation-api' },
  { id: 'languageDetector', name: 'Language Detector API', flag: '#language-detection-api' },
  { id: 'summarizer', name: 'Summarizer API', flag: '#summarization-api-for-gemini-nano' },
  { id: 'writer', name: 'Writer API', flag: '#writer-api-for-gemini-nano' },
  { id: 'rewriter', name: 'Rewriter API', flag: '#rewriter-api-for-gemini-nano' },
];

export default function BuiltInAPIs() {
  const [statuses, setStatuses] = useState<Record<string, { status: StatusType; label: string; progress?: number; missingGlobal?: boolean }>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const checkAPI = async (api: APIInfo) => {
    let status: StatusType = 'error';
    let label = 'Not Available';
    let missingGlobal = false;

    try {
        let available: string | undefined;
        let globalObj: any;

        // 1. Check for Global Constructor existence
        if (api.id === 'prompt') {
            globalObj = window.LanguageModel || window.ai?.languageModel;
        } else if (api.id === 'summarizer') {
            globalObj = window.Summarizer || window.ai?.summarizer;
        } else if (api.id === 'languageDetector') {
            globalObj = window.LanguageDetector || window.ai?.languageDetector;
        } else if (api.id === 'writer') {
            globalObj = window.Writer || window.ai?.writer;
        } else if (api.id === 'rewriter') {
            globalObj = window.Rewriter || window.ai?.rewriter;
        } else if (api.id === 'proofreader') {
            globalObj = window.Proofreader || window.ai?.proofreader;
        } else if (api.id === 'translator') {
            globalObj = window.Translator || window.ai?.translator;
        }

        if (!globalObj) {
            missingGlobal = true;
            label = 'Not Enabled';
            setStatuses(prev => ({ ...prev, [api.id]: { status: 'error', label, missingGlobal: true } }));
            return;
        }

        // 2. Check Availability
        if (api.id === 'translator') {
             try {
                // Check a common pair to gauge general availability
                if (globalObj.availability) {
                     available = await globalObj.availability({ sourceLanguage: 'es', targetLanguage: 'en' });
                }
             } catch (e) {
                 if (globalObj.capabilities) {
                     const caps = await globalObj.capabilities();
                     available = caps.available;
                 }
             }
        } else if (api.id === 'prompt') {
             if (globalObj.availability) {
                 available = await globalObj.availability();
             } else if (globalObj.capabilities) {
                 const caps = await globalObj.capabilities();
                 available = caps.available;
             }
        } else {
             if (globalObj.availability) {
                 available = await globalObj.availability();
             } else if (globalObj.capabilities) {
                 const caps = await globalObj.capabilities();
                 available = caps.available;
             }
        }

        // 3. Map status
        if (available === 'readily') {
            status = 'ready';
            label = 'Available';
        } else if (available === 'after-download' || available === 'downloadable') {
            status = 'warning';
            label = 'Needs Download';
        } else if (available === 'downloading') {
            status = 'warning';
            label = 'Downloading...';
        } else if (available === 'no') {
            status = 'error';
            label = 'Not Available';
            // Flag is enabled (global exists), but model unavailable.
        } else {
             // If undefined (e.g. neither availability nor capabilities existed)
             status = 'error';
             label = 'Not Enabled'; // Treat as missing if we can't check
             if (!available) missingGlobal = true; // effectively behaves like flag off
        }

    } catch (e) {
        console.error(`Error checking ${api.id}`, e);
        label = 'Error Checking';
    }

    setStatuses(prev => ({ ...prev, [api.id]: { status, label, missingGlobal } }));
  };

  const downloadModel = async (apiId: string) => {
      setDownloading(prev => ({ ...prev, [apiId]: true }));
      try {
          const monitor = (m: any) => {
              m.addEventListener('downloadprogress', (e: any) => {
                  const progress = Math.round((e.loaded / (e.total || 1)) * 100);
                  setStatuses(prev => ({
                      ...prev,
                      [apiId]: { ...prev[apiId], label: `Downloading ${progress}%`, progress, status: 'warning' }
                  }));
              });
          };

          if (apiId === 'prompt') {
              const factory = window.LanguageModel || window.ai?.languageModel;
              await factory?.create({ monitor } as any);
          } else if (apiId === 'summarizer') {
              const factory = window.Summarizer || window.ai?.summarizer;
              await factory?.create({ monitor } as any);
          } else if (apiId === 'languageDetector') {
              const factory = window.LanguageDetector || window.ai?.languageDetector;
              await factory?.create({ monitor } as any);
          } else if (apiId === 'writer') {
               const factory = window.Writer || window.ai?.writer;
               await factory?.create({ monitor } as any);
          } else if (apiId === 'rewriter') {
               const factory = window.Rewriter || window.ai?.rewriter;
               await factory?.create({ monitor } as any);
          } else if (apiId === 'proofreader') {
               const factory = window.Proofreader || window.ai?.proofreader;
               await factory?.create({ monitor } as any);
          } else if (apiId === 'translator') {
               const factory = window.Translator || window.ai?.translator;
               await factory?.create({ sourceLanguage: 'es', targetLanguage: 'en', monitor } as any);
          }

          // Re-check status after download
          const apiInfo = APIS.find(a => a.id === apiId);
          if (apiInfo) checkAPI(apiInfo);

      } catch (e) {
          console.error(`Download failed for ${apiId}`, e);
          setStatuses(prev => ({ ...prev, [apiId]: { ...prev[apiId], status: 'error', label: 'Download Failed' } }));
      } finally {
          setDownloading(prev => ({ ...prev, [apiId]: false }));
      }
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
        const isDownloading = downloading[api.id];

        return (
            <StatusItem
                key={api.id}
                label={api.name}
                action={
                    info.missingGlobal ? (
                        <button
                            onClick={() => chrome.tabs.create({ url: `chrome://flags/${api.flag}` })}
                            className="text-xs text-blue-500 hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                            Enable Flag
                        </button>
                    ) : info.status === 'warning' && !isDownloading && (info.label === 'Needs Download') ? (
                         <Button variant="outline" size="sm" onClick={() => downloadModel(api.id)} className="h-6 text-xs px-2">
                            <Download className="w-3 h-3 mr-1" /> Download
                         </Button>
                    ) : null
                }
            >
                <StatusIndicator status={info.status} label={info.label} />
                {isDownloading && (
                     <div className="w-full bg-secondary h-1.5 mt-2 rounded overflow-hidden relative">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${info.progress || 0}%` }}
                        ></div>
                     </div>
                )}
            </StatusItem>
        );
      })}
    </StatusCard>
  );
}
