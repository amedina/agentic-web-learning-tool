/**
 * External dependencies
 */
import { useCallback } from 'react';
import { Languages } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../ui';
import { useApi, useFlow } from '../../../../store';

export const TranslatorApiSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  sourceLanguage: z.enum(['en', 'ja', 'es']),
  targetLanguage: z.enum(['en', 'ja', 'es']),
});

export type TranslatorApiConfig = z.infer<typeof TranslatorApiSchema>;

const createConfig: () => TranslatorApiConfig = () => {
  return {
    title: 'Translator',
    description: 'Translate text from one language to another.',
    sourceLanguage: 'en',
    targetLanguage: 'es',
  };
};

const TranslatorApi = () => {
  const { addFlowNode } = useFlow(({ actions }) => ({
    addFlowNode: actions.addNode,
  }));

  const { addApiNode } = useApi(({ actions }) => ({
    addApiNode: actions.addNode,
  }));

  const addTranslatorApiNode = useCallback(() => {
    const config = createConfig();
    const id = new Date().getTime().toString();

    addFlowNode({
      id,
      type: 'translatorApi',
      position: { x: 0, y: 0 },
      data: {},
    });

    addApiNode({
      id,
      type: 'translatorApi',
      config,
    });
  }, [addApiNode, addFlowNode]);

  return (
    <ToolItem
      label="Translator API"
      onClick={addTranslatorApiNode}
      Icon={Languages}
    />
  );
};

export default TranslatorApi;
