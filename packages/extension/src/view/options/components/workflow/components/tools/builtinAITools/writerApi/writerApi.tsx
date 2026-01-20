/**
 * External dependencies
 */
import { useCallback } from 'react';
import { PenTool } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../ui';
import { useApi, useFlow } from '../../../../store';

export const WriterApiSchema = z.object({
  title: z.string(),
  context: z.string(),
  tone: z.enum(['formal', 'neutral', 'casual']),
  format: z.enum(['markdown', 'plain-text']),
  length: z.enum(['short', 'medium', 'long']),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
  outputLanguage: z.enum(['en', 'ja', 'es']),
});

export type WriterApiConfig = z.infer<typeof WriterApiSchema>;

const createConfig: () => WriterApiConfig = () => {
  return {
    title: 'Writer',
    context:
      'A helpful assistant that writes content based on the provided context.',
    tone: 'neutral',
    format: 'markdown',
    length: 'short',
    expectedInputLanguages: ['en', 'ja', 'es'],
    outputLanguage: 'es',
  };
};

const WriterApi = () => {
  const { addFlowNode } = useFlow(({ actions }) => ({
    addFlowNode: actions.addNode,
  }));

  const { addApiNode, isAvailable } = useApi(({ state, actions }) => ({
    addApiNode: actions.addNode,
    isAvailable: state.capabilities.writerApi,
  }));

  const addWriterApiNode = useCallback(() => {
    if (!isAvailable) return;

    const config = createConfig();
    const id = new Date().getTime().toString();

    addFlowNode({
      id,
      type: 'writerApi',
      position: { x: 0, y: 0 },
      data: {
        label: 'Writer API',
      },
    });

    addApiNode({
      id,
      type: 'writerApi',
      config,
    });
  }, [addApiNode, addFlowNode, isAvailable]);

  return (
    <ToolItem
      label="Writer API"
      onClick={addWriterApiNode}
      Icon={PenTool}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? 'Built-in Writer API is not available in this browser'
          : undefined
      }
    />
  );
};

export default WriterApi;
