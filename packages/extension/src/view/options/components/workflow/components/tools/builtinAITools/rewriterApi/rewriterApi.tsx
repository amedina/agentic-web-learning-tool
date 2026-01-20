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

  const { addApiNode } = useApi(({ actions }) => ({
    addApiNode: actions.addNode,
  }));

  const addRewriterApiNode = useCallback(() => {
    const config = createConfig();
    const id = new Date().getTime().toString();

    addFlowNode({
      id,
      type: 'rewriterApi',
      position: { x: 0, y: 0 },
      data: {},
    });

    addApiNode({
      id,
      type: 'rewriterApi',
      config,
    });
  }, [addApiNode, addFlowNode]);

  return (
    <ToolItem
      label="Rewriter API"
      onClick={addRewriterApiNode}
      Icon={RefreshCcw}
    />
  );
};

export default RewriterApi;
