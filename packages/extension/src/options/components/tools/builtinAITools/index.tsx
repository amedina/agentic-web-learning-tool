import { PromptApi, ProofreaderApi, RewriterApi, WriterApi } from './tools';

const BuiltInAITools = () => {
	return (
		<div className="w-full">
			<PromptApi />
			<WriterApi />
			<RewriterApi />
			<ProofreaderApi />
		</div>
	);
};

export default BuiltInAITools;
