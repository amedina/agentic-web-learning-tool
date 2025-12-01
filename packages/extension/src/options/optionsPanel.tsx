import Flow from './components/flow';
import ToolsBar from './components/tools';
import { ToolsConfig } from './components/tools/ui';

function OptionsPanel() {
	return (
		<div className="h-dvh w-dvw flex">
			<ToolsBar />
			<Flow />
			<ToolsConfig />
		</div>
	);
}

export default OptionsPanel;
