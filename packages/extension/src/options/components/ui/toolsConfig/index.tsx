import { ChevronsLeft, ChevronsRight, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

export interface ToolsConfigProps {
	title?: string;
	selectedNodeId?: string | null;
	nodeType?: string;
	nodeLabel?: string;
	nodeContext?: string;
	nodeDescription?: string;
	onLabelChange?: (value: string) => void;
	onContextChange?: (value: string) => void;
	onFormChange?: (e: React.FormEvent<HTMLFormElement>) => void;
	children?: ReactNode;
	collapsed?: boolean;
	onToggle?: () => void;
}

const ToolsConfig = ({
	title = 'Node Configuration',
	selectedNodeId,
	nodeType,
	nodeLabel = '',
	nodeContext = '',
	nodeDescription,
	onLabelChange,
	onContextChange,
	onFormChange,
	children,
	collapsed = false,
	onToggle,
}: ToolsConfigProps) => {
	if (collapsed) {
		return (
			<div className="w-14 bg-white border-l border-slate-200 flex flex-col h-full items-center relative transition-all duration-300">
				<div className="flex flex-col items-center py-4 border-b border-slate-200 bg-slate-50 w-full relative">
					<button
						onClick={onToggle}
						className="absolute -left-1 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors z-10"
						title="Expand Config"
					>
						<ChevronsLeft size={16} />
					</button>
					<Settings size={20} className="text-slate-600" />
				</div>
				<div className="flex-1 flex flex-col items-center pt-8 gap-6 overflow-hidden">
					<div className="[writing-mode:vertical-lr] rotate-180 text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
						Configuration
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-74 bg-white border-l border-slate-200 flex flex-col h-full transition-all duration-300">
			<div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 relative">
				<button
					onClick={onToggle}
					className="p-1.5 mr-2 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
					title="Collapse Config"
				>
					<ChevronsRight size={18} />
				</button>
				<div className="flex items-center gap-2 flex-1">
					<Settings size={20} className="text-slate-600" />
					<h2 className="font-semibold text-slate-800">{title}</h2>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{!selectedNodeId ? (
					<div className="p-8 text-center text-slate-500">
						<Settings
							size={48}
							className="mx-auto mb-4 text-slate-300"
						/>
						<p className="text-sm">
							Select a node to configure its settings
						</p>
					</div>
				) : (
					<form
						id="node-config-form"
						onChange={onFormChange}
						onSubmit={(e) => e.preventDefault()}
						className="p-4 space-y-4"
					>
						<div className="bg-slate-100 rounded-lg p-3">
							<div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">
								Node Type
							</div>
							<div className="text-sm font-medium text-slate-800 capitalize">
								{nodeType?.replace(/([A-Z])/g, ' $1').trim()}
							</div>
						</div>

						<div>
							<label
								className="block text-sm font-medium text-slate-700 mb-2"
								htmlFor="title"
							>
								Node Label
							</label>
							<input
								type="text"
								className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
								value={nodeLabel}
								onChange={(e) =>
									onLabelChange?.(e.target.value)
								}
								id="title"
								name="title"
								placeholder="Enter node label..."
							/>
						</div>

						<div>
							{onContextChange ? (
								<>
									<label
										className="block text-sm font-medium text-slate-700 mb-2"
										htmlFor="context"
									>
										Context
									</label>
									<textarea
										className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none bg-white"
										rows={4}
										value={nodeContext}
										id="context"
										name="context"
										onChange={(e) =>
											onContextChange?.(e.target.value)
										}
										placeholder="Enter context for the tool..."
									/>
								</>
							) : (
								nodeDescription && (
									<p className="text-sm text-slate-700 mb-2">
										{nodeDescription}
									</p>
								)
							)}
						</div>

						{children}
					</form>
				)}
			</div>

			<div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
				<p>Changes are saved automatically</p>
			</div>
		</div>
	);
};

export default ToolsConfig;
