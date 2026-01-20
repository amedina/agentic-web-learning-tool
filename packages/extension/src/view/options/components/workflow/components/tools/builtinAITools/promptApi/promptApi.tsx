/**
 * External dependencies
 */
import { useCallback } from 'react';
import { NotebookTextIcon } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { useApi, useFlow } from '../../../../store';
import { ToolItem } from '../../../ui';

export const PromptApiSchema = z.object({
  title: z.string(),
  context: z.string(),
  topK: z.number().min(1).max(128),
  temperature: z.number().min(0).max(2),
  expectedInputsLanguages: z.array(z.enum(['en', 'es', 'ja'])),
  expectedOutputsLanguages: z.array(z.enum(['en', 'es', 'ja'])),
  initialPrompts: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
});

export type PromptApiConfig = z.infer<typeof PromptApiSchema>;

const createConfig: () => PromptApiConfig = () => {
  return {
    title: 'Chat Assistant',
    context: 'You are a helpful assistant',
    topK: 3,
    temperature: 1,
    expectedInputsLanguages: ['en', 'ja'],
    expectedOutputsLanguages: ['ja'],
    initialPrompts: [
      { role: 'system', content: 'You are a helpful assistant.' },
    ],
  };
};

const PromptApi = () => {
  const { addFlowNode } = useFlow(({ actions }) => ({
    addFlowNode: actions.addNode,
  }));

  const { addApiNode, isAvailable } = useApi(({ state, actions }) => ({
    addApiNode: actions.addNode,
    isAvailable: state.capabilities.promptApi,
  }));

  const addPromptApiNode = useCallback(() => {
    if (!isAvailable) return;

    const config = createConfig();
    const id = new Date().getTime().toString();

    addFlowNode({
      id,
      type: 'promptApi',
      position: { x: 0, y: 0 },
      data: {
        label: 'Chat Assistant',
      },
    });

    addApiNode({
      id,
      type: 'promptApi',
      config,
    });
  }, [addApiNode, addFlowNode, isAvailable]);

  return (
    <ToolItem
      label="Chat Assistant"
      onClick={addPromptApiNode}
      Icon={NotebookTextIcon}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? 'Built-in Prompt API is not available in this browser'
          : undefined
      }
    />
  );
};

export default PromptApi;
