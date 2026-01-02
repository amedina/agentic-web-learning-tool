/**
 * Internal dependencies
 */
import { Flow, ToolsBar, ToolsConfig } from './components';

function Panel() {
	return (
		<div className="h-dvh w-dvw flex">
			<ToolsBar />
			<Flow />
			<ToolsConfig />
		</div>
	);
}

export default Panel;
