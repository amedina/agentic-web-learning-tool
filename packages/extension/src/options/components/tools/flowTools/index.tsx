/**
 * Internal dependencies
 */
import { Start, End } from './tools';

interface FlowToolsBarProps {
	collapsed?: boolean;
}

const FlowToolsBar = ({ collapsed }: FlowToolsBarProps) => {
	return (
		<div className="w-full">
			{!collapsed ? (
				<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
					Workflow Lifecycle
				</h3>
			) : (
				<div className="border-t border-slate-200 my-4 mx-2" />
			)}
			<div className="space-y-1">
				<Start />
				<End />
			</div>
		</div>
	);
};

export default FlowToolsBar;
