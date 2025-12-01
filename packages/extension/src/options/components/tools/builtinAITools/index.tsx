import { PromptApi, RewriterApi, WriterApi } from './tools';

const BuiltInAITools = () => {
	return (
		<div className="w-full">
			<PromptApi />
			<WriterApi />
			<RewriterApi />
		</div>
	);
};

export default BuiltInAITools;
