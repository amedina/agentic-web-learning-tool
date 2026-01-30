
import { useState, useEffect } from 'react';
import StatusCard from '../components/StatusCard';
import StatusItem from '../components/StatusItem';
import StatusIndicator, { type StatusType } from '../components/StatusIndicator';
import { Button } from '@google-awlt/design-system';
import { ExternalLink } from 'lucide-react';

export default function LocalAIEnvironment() {
  const [modelStatus, setModelStatus] = useState<StatusType>('loading');
  const [modelLabel, setModelLabel] = useState<string>('Checking...');
  const [hardwareStatus, setHardwareStatus] = useState<StatusType>('loading');
  const [hardwareDetails, setHardwareDetails] = useState<{ ram: number; disk: string; vram?: string }>({ ram: 0, disk: '' });

  const checkModelStatus = async () => {
    try {
      if (!window.ai?.languageModel) {
        setModelStatus('error');
        setModelLabel('Not Found');
        return;
      }

      const capabilities = await window.ai.languageModel.capabilities();
      if (capabilities.available === 'readily') {
        setModelStatus('ready');
        setModelLabel('Up-to-date');
      } else if (capabilities.available === 'after-download') {
        setModelStatus('warning');
        setModelLabel('Downloading / Needs Download');
      } else {
        setModelStatus('error');
        setModelLabel('Not Available');
      }
    } catch (e) {
      setModelStatus('error');
      setModelLabel('Error Checking');
    }
  };

  const checkHardware = async () => {
    let ramStatus: StatusType;
    let diskStatus: StatusType = 'ready';

    // RAM Check
    const ram = (navigator as any).deviceMemory || 0;
    // Note: deviceMemory is capped at 8GB in standard contexts.
    // Requirement says >16GB recommended.
    // If we get 8, we assume it's at least 8.
    // If < 4GB, definitely warning/error.
    if (ram < 4) {
      ramStatus = 'error';
    } else if (ram < 8) {
      ramStatus = 'warning';
    } else {
      ramStatus = 'ready';
    }

    // Disk Check
    let diskStr = 'Unknown';
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const { quota, usage } = await navigator.storage.estimate();
        if (quota) {
            const freeBytes = quota - (usage || 0);
            const freeGB = (freeBytes / (1024 * 1024 * 1024)).toFixed(1);
            diskStr = `${freeGB} GB Free`;
            if (freeBytes < 2 * 1024 * 1024 * 1024) { // < 2GB
                diskStatus = 'warning';
            }
        }
      } catch (e) {
        console.error('Storage estimate error', e);
      }
    }

    setHardwareDetails({
        ram,
        disk: diskStr,
        vram: 'Unknown (API unavailable)'
    });

    if ((ramStatus as any) === 'error' || (diskStatus as any) === 'error') {
        setHardwareStatus('error');
    } else if ((ramStatus as any) === 'warning' || (diskStatus as any) === 'warning') {
        setHardwareStatus('warning');
    } else {
        setHardwareStatus('ready');
    }
  };

  useEffect(() => {
    checkModelStatus();
    checkHardware();
  }, []);

  const flags = [
    { name: '#optimization-guide-on-device-model', required: true, label: 'Optimization Guide' },
    { name: '#prompt-api-for-gemini-nano', required: true, label: 'Prompt API' },
    { name: '#web-machine-learning-neural-network', required: false, label: 'WebNN API' },
  ];

  return (
    <StatusCard
        title="Local AI Environment"
        description="Prerequisite for the Playground and Offline capabilities."
    >
      {/* Model Component Status */}
      <StatusItem
        label="Model Component Status"
        action={
            <Button variant="outline" size="sm" onClick={() => chrome.tabs.create({ url: 'chrome://components' })}>
                Check Updates <ExternalLink className="w-3 h-3 ml-2"/>
            </Button>
        }
      >
        <StatusIndicator status={modelStatus} label={modelLabel} />
        <p className="text-xs text-muted-foreground mt-1">Mirrors "Optimization Guide On Device Model"</p>
      </StatusItem>

      {/* Chrome Configuration Flags */}
      <div className="py-2 border-b border-border/50">
        <span className="text-sm font-medium block mb-2">Chrome Configuration Flags</span>
        <div className="space-y-2">
            {flags.map(flag => (
                <div key={flag.name} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">{flag.name}</span>
                    <button
                        onClick={() => chrome.tabs.create({ url: `chrome://flags/${flag.name}` })}
                        className="text-blue-500 hover:underline flex items-center text-xs cursor-pointer bg-transparent border-0 p-0"
                    >
                        [Go to flag] <ExternalLink className="w-3 h-3 ml-1"/>
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Hardware Readiness */}
      <StatusItem label="Hardware Readiness">
        <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">System RAM</span>
                <span className={`text-xs ${hardwareDetails.ram < 8 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {hardwareDetails.ram >= 8 ? '8GB+' : `${hardwareDetails.ram}GB`}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">GPU VRAM</span>
                <span className="text-xs text-muted-foreground">{hardwareDetails.vram}</span>
            </div>
             <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Disk Space</span>
                <span className="text-xs text-green-500">{hardwareDetails.disk}</span>
            </div>
            <div className="mt-2">
                <StatusIndicator status={hardwareStatus} label={hardwareStatus === 'ready' ? 'Compatible' : 'Check Specs'} />
            </div>
        </div>
      </StatusItem>

    </StatusCard>
  );
}
