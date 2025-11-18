import Flow from './components/flow';
import Tools from './components/tools';
import ToolsConfig from './components/toolsConfig';

function OptionsPanel() {
	return (
		<div className="h-dvh w-dvw px-8 py-6 flex gap-8">
			<Tools />
			<Flow />
			<ToolsConfig />
		</div>
	);
}

export default OptionsPanel;
