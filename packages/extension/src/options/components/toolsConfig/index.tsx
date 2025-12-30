/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
import { useApi } from '../../store';
import {
	PromptApiToolConfig,
	ProofreaderApiToolConfig,
	RewriterApiToolConfig,
	SummarizerApiToolConfig,
	TranslatorApiToolConfig,
	WriterApiToolConfig,
	DomInputToolConfig,
	StaticInputToolConfig,
	ConditionToolConfig,
	DomReplacementToolConfig,
	FileCreatorToolConfig,
	TooltipToolConfig,
	LoopToolConfig,
} from '../tools';
import { ToolsConfig as ToolsConfigComponent } from '../ui';

const TOOLS = {
	promptApi: PromptApiToolConfig,
	writerApi: WriterApiToolConfig,
	rewriterApi: RewriterApiToolConfig,
	proofreaderApi: ProofreaderApiToolConfig,
	translatorApi: TranslatorApiToolConfig,
	languageDetectorApi: null,
	summarizerApi: SummarizerApiToolConfig,
	alertNotification: null,
	domInput: DomInputToolConfig,
	condition: ConditionToolConfig,
	staticInput: StaticInputToolConfig,
	loop: LoopToolConfig,
	domReplacement: DomReplacementToolConfig,
	clipboardWriter: null,
	fileCreator: FileCreatorToolConfig,
	textToSpeech: null,
	tooltip: TooltipToolConfig,
};

interface ToolsConfigProps {
	collapsed?: boolean;
	onToggle?: () => void;
}

const ToolsConfig = ({ collapsed = false, onToggle }: ToolsConfigProps) => {
	const { selectedNode, getNode, updateNode } = useApi(
		({ state, actions }) => ({
			selectedNode: state.selectedNode,
			getNode: actions.getNode,
			updateNode: actions.updateNode,
		})
	);

	const [node, setNode] = useState<ReturnType<typeof getNode>>();
	const [config, setConfig] = useState<any>();

	const toolNodeRef = useRef<{
		getConfig: (formData: FormData) => any;
	}>(null);

	useEffect(() => {
		if (selectedNode) {
			const _node = getNode(selectedNode);
			setNode(_node);
		} else {
			setNode(undefined);
		}
	}, [selectedNode, getNode]);

	useEffect(() => {
		setConfig(node?.config);
	}, [node]);

	const handleConfigUpdate = useCallback(
		(form: HTMLFormElement) => {
			const formData = new FormData(form);
			if (!node || !selectedNode) return;

			const toolConfig = toolNodeRef.current?.getConfig(formData);
			if (!toolConfig) {
				return;
			}

			updateNode(selectedNode, {
				config: toolConfig,
			});
		},
		[node, selectedNode, updateNode]
	);

	const handleChange = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			const form = e.currentTarget;

			handleConfigUpdate(form);
		},
		[handleConfigUpdate]
	);

	const Tool = node?.type
		? (TOOLS[node.type as keyof typeof TOOLS] as any)
		: null;

	return (
		<ToolsConfigComponent
			selectedNodeId={selectedNode}
			nodeType={node?.type}
			nodeLabel={config?.title || ''}
			nodeContext={config?.context}
			nodeDescription={(node?.config as any)?.description}
			onLabelChange={(value) =>
				setConfig((prev: any) => ({ ...prev, title: value }))
			}
			onContextChange={
				config?.context !== undefined
					? (value) =>
							setConfig((prev: any) => ({
								...prev,
								context: value,
							}))
					: undefined
			}
			onFormChange={handleChange}
			collapsed={collapsed}
			onToggle={onToggle}
		>
			{Tool && node && <Tool ref={toolNodeRef} config={node.config} />}
		</ToolsConfigComponent>
	);
};

export default ToolsConfig;
