/**
 * External dependencies
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { TerminalIcon } from 'lucide-react';
import {
  listWorkflows,
  getWorkflowClient,
} from '@google-awlt/engine-extension';
import type { WorkflowJSON } from '@google-awlt/engine-core';

/**
 * Internal dependencies
 */
import { isDomainAllowed } from '../../../../serviceWorker/utils';
import WorkflowCard from './workflowCard';
import { useWorkflowSync } from '../../hooks/useWorkflowSync';

interface WorkflowListProps {
  activeTabId?: number;
  activeTabUrl?: string;
}

const WorkflowList = ({ activeTabId, activeTabUrl }: WorkflowListProps) => {
  const [workflows, setWorkflows] = useState<WorkflowJSON[]>([]);
  const [loading, setLoading] = useState(true);

  const { workflowId: globalRunningWorkflowId, status: globalStatus } =
    useWorkflowSync();

  const runningWorkflowId =
    globalStatus === 'running' ? globalRunningWorkflowId : null;

  const fetchWorkflows = useCallback(async () => {
    try {
      const list = await listWorkflows();
      setWorkflows(list);
    } catch (error) {
      console.error('Failed to list workflows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const filteredWorkflows = useMemo(() => {
    if (!activeTabUrl) return [];

    return workflows.filter((wf) =>
      isDomainAllowed(activeTabUrl, wf.meta.allowedDomains)
    );
  }, [workflows, activeTabUrl]);

  const handleRun = useCallback(
    async (workflow: WorkflowJSON) => {
      if (runningWorkflowId) return;
      let unsubscribeUpdates: (() => void) | undefined = undefined;

      try {
        const client = getWorkflowClient();

        unsubscribeUpdates = client.subscribeToUpdates({
          onNodeStart: (nodeId) => {
            console.log('Node started:', nodeId);
          },
          onNodeFinish: (nodeId, output) => {
            console.log('Node finished:', nodeId, output);
          },
          onComplete: () => {
            console.log('Workflow completed');
          },
          onError: () => {
            console.log('Workflow error');
          },
        });

        await client.runWorkflow(workflow, activeTabId);
      } catch (error) {
        console.error('Failed to run workflow:', error);
      } finally {
        unsubscribeUpdates?.();
      }
    },
    [activeTabId, runningWorkflowId]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
        <p className="text-sm font-medium">Loading workflows...</p>
      </div>
    );
  }

  if (filteredWorkflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
        <div className="bg-accent/30 p-4 rounded-full mb-4">
          <TerminalIcon className="opacity-40" size={32} />
        </div>
        <h3 className="text-foreground font-medium mb-1">
          No matching workflows
        </h3>
        <p className="text-xs max-w-[200px] mb-4 text-balance">
          {activeTabUrl
            ? `No workflows are enabled for ${new URL(activeTabUrl).hostname}.`
            : 'Select a tab to see available workflows.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2 h-full w-full overflow-y-auto pr-1 custom-scrollbar">
      {filteredWorkflows.map((wf) => (
        <WorkflowCard
          key={wf.meta.id}
          workflow={wf}
          onRun={() => handleRun(wf)}
          isRunning={runningWorkflowId === wf.meta.id}
          isOtherRunning={
            !!runningWorkflowId && runningWorkflowId !== wf.meta.id
          }
        />
      ))}
    </div>
  );
};

export default WorkflowList;
