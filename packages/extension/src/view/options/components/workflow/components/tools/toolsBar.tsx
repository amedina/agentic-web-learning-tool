import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ToolSidebarProvider } from './toolSidebarContext';
import BuiltInAIToolsBar from './builtinAITools';
import JSToolsBar from './jsTools';
import FlowToolsBar from './flowTools';

interface ToolsBarProps {
	collapsed?: boolean;
	onToggle?: () => void;
}

const ToolsBar = ({ collapsed = false, onToggle }: ToolsBarProps) => {
	return (
		<ToolSidebarProvider collapsed={collapsed}>
			<div className="bg-slate-50 border-r border-slate-200 h-full flex flex-col overflow-y-auto overflow-x-hidden">
				<div
					className={`border-b border-slate-200 bg-white transition-all duration-300 relative ${
						collapsed ? 'p-2 flex justify-center' : 'p-4'
					}`}
				>
					{collapsed ? (
						<>
							<button
								onClick={onToggle}
								className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm hover:scale-105 transition-transform cursor-pointer"
								title="Expand Sidebar"
							>
								A
							</button>
							<button
								onClick={onToggle}
								className="absolute -right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
								title="Expand Sidebar"
							>
								<ChevronsRight size={16} />
							</button>
						</>
					) : (
						<div className="flex items-center justify-between">
							<div>
								<h1 className="font-bold text-slate-800 text-lg">
									Workflow Composer
								</h1>
								<p className="text-xs text-slate-500">
									AI-Powered Workflows
								</p>
							</div>
							<button
								onClick={onToggle}
								className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
								title="Collapse Sidebar"
							>
								<ChevronsLeft size={18} />
							</button>
						</div>
					)}
				</div>

				<div
					className={`flex-1 space-y-6 transition-all duration-300 ${
						collapsed ? 'p-2' : 'p-4'
					}`}
				>
					<FlowToolsBar collapsed={collapsed} />
					<BuiltInAIToolsBar collapsed={collapsed} />
					<JSToolsBar collapsed={collapsed} />
				</div>
			</div>
		</ToolSidebarProvider>
	);
};

export default ToolsBar;
