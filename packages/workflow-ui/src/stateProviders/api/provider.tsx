/**
 * External dependencies
 */
import {
  useCallback,
  useState,
  useEffect,
  type PropsWithChildren,
} from "react";
import {
  getWorkflowClient,
  setLastOpenedWorkflowId,
} from "@google-awlt/engine-extension";
import { type WorkflowMeta } from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import Context, { type ApiNodeConfig } from "./context";
import logger from "../../logger";

const ApiProvider = ({ children }: PropsWithChildren) => {
  const [nodes, setNodes] = useState<{
    [id: string]: ApiNodeConfig;
  }>({});

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>({});
  const [workflowMeta, setWorkflowMeta] = useState<WorkflowMeta | undefined>();

  const getNode = useCallback(
    (id: string) => {
      return nodes[id];
    },
    [nodes],
  );

  const addNode = useCallback((node: ApiNodeConfig & { id: string }) => {
    setNodes((prev) => ({
      ...prev,
      [node.id]: {
        type: node.type,
        config: node.config,
      },
    }));

    setSelectedNode(node.id);
  }, []);

  const updateNode = useCallback(
    (
      id: string,
      updates: {
        type?: ApiNodeConfig["type"];
        config?: ApiNodeConfig["config"];
      },
    ) => {
      setNodes((prev) => {
        if (!prev || !prev[id]) return prev;

        return {
          ...prev,
          [id]: {
            ...prev[id],
            ...updates,
            config: {
              ...prev[id].config,
              ...updates.config,
            },
          },
        };
      });
    },
    [],
  );

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => {
      if (!prev || !prev[id]) return prev;

      const updated = { ...prev };
      delete updated[id];
      setSelectedNode((current) => (current === id ? null : current));

      return updated;
    });
  }, []);

  const clearApiData = useCallback(() => {
    setNodes({});
    setSelectedNode(null);
    setWorkflowMeta((prev) => {
      if (!prev) return undefined;

      return {
        id: prev.id,
        name: prev.name,
        description: prev.description,
        allowedDomains: prev.allowedDomains,
        savedAt: new Date().toISOString(),
        autosave: prev.autosave,
      };
    });
  }, []);

  const updateWorkflowMeta = useCallback(
    (updates: Partial<WorkflowMeta>, newMeta?: boolean) => {
      // @ts-ignore
      setWorkflowMeta((prev) => {
        if (newMeta) return updates;

        if (!prev) return undefined;

        return {
          ...prev,
          ...updates,
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (workflowMeta?.id) {
      setLastOpenedWorkflowId(workflowMeta.id);
    }
  }, [workflowMeta?.id]);

  const checkCapabilities = useCallback(async () => {
    try {
      const client = getWorkflowClient();
      const results = await client.checkCapabilities([
        "promptApi",
        "writerApi",
        "rewriterApi",
        "summarizerApi",
        "translatorApi",
        "languageDetectorApi",
        "proofreaderApi",
      ]);

      setCapabilities({
        ...results,
        translatorApi: true, // Always show in UI per user request
      });
    } catch (error) {
      logger(["error"], ["Failed to check capabilities:", error]);
    }
  }, []);

  useEffect(() => {
    checkCapabilities();
  }, [checkCapabilities]);

  return (
    <Context.Provider
      value={
        {
          state: {
            nodes,
            selectedNode,
            capabilities,
            workflowMeta,
          },
          actions: {
            getNode,
            addNode,
            updateNode,
            removeNode,
            setSelectedNode,
            updateWorkflowMeta,
            clearApiData,
            checkCapabilities,
          },
        } as any
      }
    >
      {children}
    </Context.Provider>
  );
};

export default ApiProvider;
