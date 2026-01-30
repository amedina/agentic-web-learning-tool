
import StatusCard from '../components/StatusCard';
import StatusItem from '../components/StatusItem';
import { Button } from '@google-awlt/design-system';
import { ExternalLink } from 'lucide-react';

export default function LocalAIEnvironment() {
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
      />

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
                        <ExternalLink className="w-3 h-3 ml-1"/>
                    </button>
                </div>
            ))}
        </div>
      </div>
    </StatusCard>
  );
}
