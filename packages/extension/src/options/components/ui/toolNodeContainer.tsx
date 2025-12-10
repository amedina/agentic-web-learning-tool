import { Pen, X } from 'lucide-react';
import type { JSX, PropsWithChildren } from 'react';

interface ToolNodeContainerProps {
	title: string;
	type: string;
	Icon: JSX.ElementType;
	selected: boolean;
	onEdit: () => void;
	onRemove: () => void;
}

const ToolNodeContainer = ({
	children,
	title,
	type,
	Icon,
	selected,
	onEdit,
	onRemove,
}: PropsWithChildren<ToolNodeContainerProps>) => {
	return (
		<div
			className={`bg-white rounded-lg shadow-md border-2 w-[300px] transition-all ${selected ? 'border-indigo-500 shadow-lg' : 'border-slate-200'}`}
			onClick={onEdit}
		>
			<div
				className={`w-full flex items-center justify-between p-2 rounded-t-md border-b border-slate-100 ${selected ? 'bg-indigo-50' : 'bg-slate-50'}`}
			>
				<div className="flex items-center gap-2 text-slate-700">
					<Icon size={16} className="text-indigo-600" />
					<p className="flex flex-col ml-1">
						<span className="font-semibold text-sm">{title}</span>
						<span className="font-medium text-[10px] text-gray-400 italic">
							({type})
						</span>
					</p>
				</div>
				<div className="flex items-center gap-1">
					<button
						onClick={onRemove}
						className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
					>
						<X size={14} />
					</button>
				</div>
			</div>
			<div className="w-full p-3">{children}</div>
		</div>
	);
};

export default ToolNodeContainer;
