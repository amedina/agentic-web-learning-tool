import { Flow, ToolsBar, ToolsConfig } from './components';

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
