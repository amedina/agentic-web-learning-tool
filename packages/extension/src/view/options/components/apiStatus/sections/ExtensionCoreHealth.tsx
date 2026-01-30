
import { useState, useEffect } from 'react';
import StatusCard from '../components/StatusCard';
import StatusItem from '../components/StatusItem';
import StatusIndicator, { type StatusType } from '../components/StatusIndicator';
import { Button, toast } from '@google-awlt/design-system';
import { Trash2, Download, Power } from 'lucide-react';

export default function ExtensionCoreHealth() {
  const [swStatus, setSwStatus] = useState<StatusType>('loading');
  const [swLabel, setSwLabel] = useState<string>('Pinging...');
  const [storageUsage, setStorageUsage] = useState<string>('Unknown');
  const [storageStatus, setStorageStatus] = useState<StatusType>('ready');
  const [userScriptsStatus, setUserScriptsStatus] = useState<StatusType>('loading');

  const checkServiceWorker = async () => {
    setSwStatus('loading');
    setSwLabel('Pinging...');
    try {
      const start = Date.now();
      const response = await chrome.runtime.sendMessage({ type: 'PING' });
      const latency = Date.now() - start;
      if (response && response.status === 'ok') {
        setSwStatus('ready');
        setSwLabel(`Active (${latency}ms)`);
      } else {
        setSwStatus('error');
        setSwLabel('No Response');
      }
    } catch (e) {
      setSwStatus('error');
      setSwLabel('Disconnected');
    }
  };

  const checkStorage = async () => {
    try {
      const bytes = await chrome.storage.local.getBytesInUse(null);
      const kb = (bytes / 1024).toFixed(2);
      setStorageUsage(`${kb} KB Used`);
      // Warning if > 4MB (Storage limit is usually 5MB for local)
      if (bytes > 4 * 1024 * 1024) {
          setStorageStatus('warning');
      } else {
          setStorageStatus('ready');
      }
    } catch (e) {
      setStorageUsage('Error reading storage');
      setStorageStatus('error');
    }
  };

  const checkUserScripts = () => {
    if (chrome.userScripts) {
      setUserScriptsStatus('ready');
    } else {
      setUserScriptsStatus('error');
    }
  };

  const clearStorage = async () => {
    if (confirm('Are you sure you want to clear all local storage? This will delete your settings and chat history.')) {
        await chrome.storage.local.clear();
        checkStorage();
        toast.success('Storage cleared');
    }
  };

  const exportData = async () => {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extension-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const restartWorker = () => {
      if (confirm('This will reload the extension. The options page will close.')) {
          chrome.runtime.reload();
      }
  };

  useEffect(() => {
    checkServiceWorker();
    checkStorage();
    checkUserScripts();
  }, []);

  return (
    <StatusCard
        title="Extension Core Health"
        description="Operational status of the extension's background infrastructure."
    >
      {/* Orchestrator */}
      <StatusItem
        label="Orchestrator (Service Worker)"
        action={
            <Button variant="outline" size="sm" onClick={restartWorker} className="text-destructive hover:text-destructive">
                <Power className="w-3 h-3 ml-2"/> Restart
            </Button>
        }
      >
        <div className="flex flex-col items-end">
            <StatusIndicator status={swStatus} label={swLabel} />
            {swStatus === 'error' && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1" onClick={checkServiceWorker}>Retry Connection</Button>
            )}
        </div>
      </StatusItem>

      {/* Storage Status */}
      <StatusItem
        label="Storage Status"
        action={
            <div className="flex gap-2">
                 <Button variant="ghost" size="icon" onClick={exportData} title="Export Data">
                    <Download className="w-4 h-4" />
                </Button>
                 <Button variant="ghost" size="icon" onClick={clearStorage} title="Clear Storage">
                    <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
            </div>
        }
      >
        <StatusIndicator status={storageStatus} label={storageUsage} />
      </StatusItem>

      {/* UserScripts API */}
      <StatusItem
        label="UserScripts API"
        action={
             userScriptsStatus === 'error' ? (
                <Button variant="outline" size="sm" onClick={() => chrome.tabs.create({ url: 'chrome://extensions' })}>
                    Enable Developer Mode
                </Button>
             ) : null
        }
      >
         <StatusIndicator
            status={userScriptsStatus}
            label={userScriptsStatus === 'ready' ? 'Available' : 'Unavailable'}
        />
        {userScriptsStatus === 'error' && (
            <p className="text-xs text-muted-foreground mt-1">
                Requires "Developer Mode" to be enabled in chrome://extensions
            </p>
        )}
      </StatusItem>

    </StatusCard>
  );
}
