import PromptAPI from "./toolNodes/promptAPI";

const BuiltInAITools = () => {


	return (
		<div>
			<h3 className="text-lg">Built-in AI APIs</h3>
			<div>
				<PromptAPI />
			</div>
		</div>
	);
};

export default BuiltInAITools;
