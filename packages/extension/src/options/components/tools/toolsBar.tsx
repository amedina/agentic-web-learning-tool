import { BuiltInAIToolsBar, JSToolsBar } from '.';

const ToolsBar = () => {
	return (
		<div className="w-74 bg-slate-50 border-r border-slate-200 h-full flex flex-col overflow-y-auto">
			<div className="p-4 border-b border-slate-200 bg-white">
				<h1 className="font-bold text-slate-800 text-lg">
					AWL Workflow Composer
				</h1>
				<p className="text-xs text-slate-500">AI-Powered Workflows</p>
			</div>

			<div className="p-4 space-y-6">
				<BuiltInAIToolsBar />
				<JSToolsBar />
			</div>
		</div>
	);
};

export default ToolsBar;
