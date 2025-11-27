import Flow from './components/flow';
import Tools from './components/tools';
import ToolsConfig from './components/tools/ui/toolsConfig';

function OptionsPanel() {
	return (
		<div className="h-dvh w-dvw flex">
			<Tools />
			<Flow />
			<ToolsConfig />
		</div>
	);
}

export default OptionsPanel;
