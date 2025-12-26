import { useState, useEffect } from 'react';
import { PanelRightClose, Settings } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Flow, ToolsBar, ToolsConfig } from './components';
import { useApi } from './store';

function OptionsPanel() {
	const [leftCollapsed, setLeftCollapsed] = useState(false);
	const [rightCollapsed, setRightCollapsed] = useState(false);

	const { selectedNode } = useApi(({ state }) => ({
		selectedNode: state.selectedNode,
	}));

	// Auto-expand right sidebar when a node is selected
	useEffect(() => {
		if (selectedNode) {
			setRightCollapsed(false);
		}
	}, [selectedNode]);

	// Responsive auto-collapse
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 1200) {
				setLeftCollapsed(true);
				setRightCollapsed(true);
			} else {
				setLeftCollapsed(false);
				setRightCollapsed(false);
			}
		};

		window.addEventListener('resize', handleResize);
		handleResize();

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div className="h-dvh w-dvw flex overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
			{/* Left Sidebar: Tools */}
			<div
				className={`relative flex transition-all duration-300 ease-in-out border-r border-slate-200 bg-slate-50 ${
					leftCollapsed ? 'w-20' : 'w-74'
				}`}
			>
				<div
					className={`${
						leftCollapsed ? 'w-20' : 'w-74'
					} h-full shrink-0 flex flex-col overflow-hidden transition-all duration-300`}
				>
					<ToolsBar
						collapsed={leftCollapsed}
						onToggle={() => setLeftCollapsed(!leftCollapsed)}
					/>
				</div>
			</div>

			{/* Main Canvas Area */}
			<main className="flex-1 min-w-0 h-full relative z-0">
				<Flow />
			</main>

			{/* Right Sidebar: Configuration */}
			<div
				className={`relative flex transition-all duration-300 ease-in-out border-l border-slate-200 bg-white ${
					rightCollapsed ? 'w-0' : 'w-96'
				}`}
			>
				<button
					onClick={() => setRightCollapsed(true)}
					className={`absolute -left-3 top-20 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-600 ${
						rightCollapsed ? 'hidden' : 'block'
					}`}
					title="Collapse Config"
				>
					<PanelRightClose size={14} />
				</button>

				<div className="w-96 h-full shrink-0 flex flex-col overflow-hidden">
					<ToolsConfig />
				</div>
			</div>

			{/* Floating Open Button (Right) */}
			{rightCollapsed && (
				<button
					onClick={() => setRightCollapsed(false)}
					className="absolute right-4 top-20 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-all hover:bg-slate-50 hover:scale-110 active:scale-95"
					title="Open Configuration"
				>
					<Settings size={20} />
				</button>
			)}
		</div>
	);
}

export default OptionsPanel;
