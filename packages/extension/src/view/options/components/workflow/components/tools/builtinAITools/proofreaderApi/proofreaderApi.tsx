/**
 * External dependencies
 */
import { useCallback } from 'react';
import { BookCheck } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { useApi, useFlow } from '../../../../store';
import { ToolItem } from '../../../ui';

export const ProofreaderApiSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
});

export type ProofreaderApiConfig = z.infer<typeof ProofreaderApiSchema>;

const createConfig: () => ProofreaderApiConfig = () => {
  return {
    title: 'Grammar & Tone Checker',
    description: 'Check grammar, spelling, and tone of your text.',
    expectedInputLanguages: ['en', 'ja', 'es'],
  };
};

const ProofreaderApi = () => {
  const { addFlowNode } = useFlow(({ actions }) => ({
    addFlowNode: actions.addNode,
  }));

  const { addApiNode, isAvailable } = useApi(({ state, actions }) => ({
    addApiNode: actions.addNode,
    isAvailable: state.capabilities.proofreaderApi,
  }));

  const addProofreaderApiNode = useCallback(() => {
    if (!isAvailable) return;

    const config = createConfig();
    const id = new Date().getTime().toString();

    addFlowNode({
      id,
      type: 'proofreaderApi',
      position: { x: 0, y: 0 },
      data: {
        label: 'Proofreader API',
      },
    });

    addApiNode({
      id,
      type: 'proofreaderApi',
      config,
    });
  }, [addApiNode, addFlowNode, isAvailable]);

  return (
    <ToolItem
      label="Proofreader API"
      onClick={addProofreaderApiNode}
      Icon={BookCheck}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? 'Built-in Proofreader API is not available in this browser'
          : undefined
      }
    />
  );
};

export default ProofreaderApi;
