import BuiltInAITools from './builtinAITools';
import JSTools from './jsTools';

const Tools = () => {
	return (
		<div className="h-full min-w-1/7">
			<h1 className="text-xl font-bold mb-6clear">Workflow Composer</h1>
			<div className="flex flex-col gap-4">
				<BuiltInAITools />
				<JSTools />
			</div>
		</div>
	);
};

export default Tools;
