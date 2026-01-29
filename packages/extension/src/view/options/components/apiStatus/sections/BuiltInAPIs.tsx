
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
  const [statuses, setStatuses] = useState<Record<string, { status: StatusType; label: string; progress?: number }>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const checkAPI = async (api: APIInfo) => {
    let status: StatusType = 'error';
    let label = 'Not Available';

    try {
        let available: string | undefined;

        const checkAvailability = async () => {
             // Specific checks based on documentation and types
             if (api.id === 'prompt') {
                 if (window.ai?.languageModel) return (await window.ai.languageModel.capabilities()).available;
             } else if (api.id === 'summarizer') {
                 if (window.ai?.summarizer) return (await window.ai.summarizer.capabilities?.())?.available || (await window.ai.summarizer.availability?.());
                 if (window.Summarizer) return (await window.Summarizer.capabilities?.())?.available || (await window.Summarizer.availability?.());
             } else if (api.id === 'languageDetector') {
                 if (window.ai?.languageDetector) return (await window.ai.languageDetector.capabilities?.())?.available || (await window.ai.languageDetector.availability?.());
                 if (window.LanguageDetector) return (await window.LanguageDetector.capabilities?.())?.available || (await window.LanguageDetector.availability?.());
             } else if (api.id === 'writer') {
                 if (window.ai?.writer) return (await window.ai.writer.availability?.()) || (await window.ai.writer.capabilities?.())?.available; // Check avail first for writer based on docs
                 if (window.Writer) return (await window.Writer.availability?.()) || (await window.Writer.capabilities?.())?.available;
             } else if (api.id === 'rewriter') {
                  if (window.ai?.rewriter) return (await window.ai.rewriter.availability?.()) || (await window.ai.rewriter.capabilities?.())?.available;
                  if (window.Rewriter) return (await window.Rewriter.availability?.()) || (await window.Rewriter.capabilities?.())?.available;
             } else if (api.id === 'proofreader') {
                  if (window.ai?.proofreader) return (await window.ai.proofreader.capabilities?.())?.available || (await window.ai.proofreader.availability?.());
                  if (window.Proofreader) return (await window.Proofreader.capabilities?.())?.available || (await window.Proofreader.availability?.());
             } else if (api.id === 'translator') {
                  // Translator needs specific pair checking usually, assume generic availability first
                  // Docs say translator.availability({ source, target })
                  // We'll check a common pair like es->en to gauge general availability
                  const checkPair = async (factory: any) => {
                      try {
                          return await factory.availability({ sourceLanguage: 'es', targetLanguage: 'en' });
                      } catch {
                          return 'no';
                      }
                  };
                  if (window.ai?.translator) return await checkPair(window.ai.translator);
                  if (window.Translator) return await checkPair(window.Translator);
             }
             return undefined;
        };

        available = await checkAvailability();

        if (available === 'readily') {
            status = 'ready';
            label = 'Available';
        } else if (available === 'after-download' || available === 'downloadable') {
            status = 'warning';
            label = 'Needs Download';
        } else if (available === 'no') {
            status = 'error';
            label = 'Not Available';
        }
    } catch (e) {
        console.error(`Error checking ${api.id}`, e);
    }

    setStatuses(prev => ({ ...prev, [api.id]: { status, label } }));
  };

  const downloadModel = async (apiId: string) => {
      setDownloading(prev => ({ ...prev, [apiId]: true }));
      try {
          const monitor = (m: any) => {
              m.addEventListener('downloadprogress', (e: any) => {
                  const progress = Math.round((e.loaded / (e.total || 1)) * 100); // Normalize just in case
                  setStatuses(prev => ({
                      ...prev,
                      [apiId]: { ...prev[apiId], label: `Downloading ${progress}%`, progress }
                  }));
              });
          };

          // Trigger creation with monitor
          if (apiId === 'prompt') {
              await window.ai.languageModel.create({ monitor } as any);
          } else if (apiId === 'summarizer') {
              const factory = window.ai?.summarizer || window.Summarizer;
              await factory?.create({ monitor } as any);
          } else if (apiId === 'languageDetector') {
              const factory = window.ai?.languageDetector || window.LanguageDetector;
              await factory?.create({ monitor } as any);
          } else if (apiId === 'writer') {
               const factory = window.ai?.writer || window.Writer;
               await factory?.create({ monitor } as any);
          } else if (apiId === 'rewriter') {
               const factory = window.ai?.rewriter || window.Rewriter;
               await factory?.create({ monitor } as any);
          } else if (apiId === 'proofreader') {
               const factory = window.ai?.proofreader || window.Proofreader;
               await factory?.create({ monitor } as any);
          } else if (apiId === 'translator') {
               const factory = window.ai?.translator || window.Translator;
               await factory?.create({ sourceLanguage: 'es', targetLanguage: 'en', monitor } as any);
          }

          // Re-check status after download
          const apiInfo = APIS.find(a => a.id === apiId);
          if (apiInfo) checkAPI(apiInfo);

      } catch (e) {
          console.error(`Download failed for ${apiId}`, e);
          setStatuses(prev => ({ ...prev, [apiId]: { status: 'error', label: 'Download Failed' } }));
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
                    info.status === 'error' ? (
                        <button
                            onClick={() => chrome.tabs.create({ url: `chrome://flags/${api.flag}` })}
                            className="text-xs text-blue-500 hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                            Enable Flag
                        </button>
                    ) : info.status === 'warning' && !isDownloading ? (
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
