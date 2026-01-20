/**
 * External dependencies
 */
import { useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../ui';
import { useApi, useFlow } from '../../../../store';

export const RewriterApiSchema = z.object({
  title: z.string(),
  context: z.string(),
  tone: z.enum(['more-formal', 'as-is', 'more-casual']),
  format: z.enum(['as-is', 'markdown', 'plain-text']),
  length: z.enum(['shorter', 'as-is', 'longer']),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
  outputLanguage: z.enum(['en', 'ja', 'es']),
});

export type RewriterApiConfig = z.infer<typeof RewriterApiSchema>;

const createConfig: () => RewriterApiConfig = () => {
  return {
    title: 'Rewriter',
    context: 'Rewrite text to adjust tone, format, and length.',
    tone: 'as-is',
    format: 'as-is',
    length: 'as-is',
    expectedInputLanguages: ['en', 'ja', 'es'],
    outputLanguage: 'es',
  };
};

const RewriterApi = () => {
  const { addFlowNode } = useFlow(({ actions }) => ({
    addFlowNode: actions.addNode,
  }));

  const { addApiNode, isAvailable } = useApi(({ state, actions }) => ({
    addApiNode: actions.addNode,
    isAvailable: state.capabilities.rewriterApi,
  }));

  const addRewriterApiNode = useCallback(() => {
    if (!isAvailable) return;

    const config = createConfig();
    const id = new Date().getTime().toString();

    addFlowNode({
      id,
      type: 'rewriterApi',
      position: { x: 0, y: 0 },
      data: {
        label: 'Rewriter API',
      },
    });

    addApiNode({
      id,
      type: 'rewriterApi',
      config,
    });
  }, [addApiNode, addFlowNode, isAvailable]);

  return (
    <ToolItem
      label="Rewriter API"
      onClick={addRewriterApiNode}
      Icon={RefreshCcw}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? 'Built-in Rewriter API is not available in this browser'
          : undefined
      }
    />
  );
};

export default RewriterApi;
