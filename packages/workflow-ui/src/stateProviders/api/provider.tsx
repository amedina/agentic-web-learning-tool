/**
 * External dependencies
 */
import {
  useCallback,
  useState,
  useEffect,
  type PropsWithChildren,
} from "react";
import { getWorkflowClient } from "@google-awlt/engine-extension";

/**
 * Internal dependencies
 */
import Context, { ApiCleaner, type NodeConfig } from "./context";

const ApiProvider = ({ children }: PropsWithChildren) => {
  const [nodes, setNodes] = useState<{
    [id: string]: NodeConfig;
  }>({});

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>({});

  const getNode = useCallback(
    (id: string) => {
      return nodes[id];
    },
    [nodes],
  );

  const addNode = useCallback(
    (
      node: {
        id: string;
      } & NodeConfig,
    ) => {
      setNodes((prev) => ({
        ...prev,
        [node.id]: {
          type: node.type,
          config: node.config,
        },
      }));

      setSelectedNode(node.id);
    },
    [],
  );

  const updateNode = useCallback(
    (
      id: string,
      updates: {
        type?: string;
        config?: NodeConfig["config"];
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
  }, []);

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
      console.error("Failed to check capabilities:", error);
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
          },
          actions: {
            getNode,
            addNode,
            updateNode,
            removeNode,
            setSelectedNode,
            clearApiData,
            checkCapabilities,
          },
        } as any
      }
    >
      <ApiCleaner />
      {children}
    </Context.Provider>
  );
};

export default ApiProvider;
