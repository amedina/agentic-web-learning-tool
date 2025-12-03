import { BuiltInAIToolsBar } from '.';

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
				<div className='w-full'>
					<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
						Gemini Nano APIs
					</h3>
					<BuiltInAIToolsBar />
				</div>

				<div>
					<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
						Web Elements
					</h3>
				</div>

				<div>
					<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
						Logic
					</h3>
				</div>

				<div>
					<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
						Output
					</h3>
				</div>
			</div>
		</div>
	);
};

export default ToolsBar;
