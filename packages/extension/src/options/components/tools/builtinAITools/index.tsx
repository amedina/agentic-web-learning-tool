import { PromptApi, WriterApi } from './tools';

const BuiltInAITools = () => {
	return (
		<div className="w-full">
			<PromptApi />
			<WriterApi />
		</div>
	);
};

export default BuiltInAITools;
