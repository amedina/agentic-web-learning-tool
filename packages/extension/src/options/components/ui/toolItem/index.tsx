import { useToolSidebar } from '../../tools/ToolSidebarContext';

interface ToolItemProps {
	label: string;
	onClick: () => void;
	Icon: React.ComponentType<{ size: number; className?: string }>;
	disabled?: boolean;
	title?: string;
	collapsed?: boolean;
}

const ToolItem = ({
	label,
	onClick,
	Icon,
	disabled,
	title,
	collapsed: collapsedProp,
}: ToolItemProps) => {
	const { collapsed: contextCollapsed } = useToolSidebar();
	const collapsed = collapsedProp ?? contextCollapsed;

	return (
		<button
			disabled={disabled}
			title={title || (collapsed ? label : undefined)}
			className={`flex items-center transition-all ${
				collapsed
					? 'w-12 h-12 justify-center p-0 mx-auto'
					: 'w-full gap-3 p-3 text-sm font-medium'
			} mb-2 bg-white border border-slate-200 rounded-lg ${
				disabled
					? 'opacity-50 cursor-not-allowed bg-slate-50 grayscale'
					: 'cursor-pointer hover:border-indigo-500 hover:shadow-md text-slate-700'
			}`}
			onClick={onClick}
		>
			<Icon
				size={18}
				className={disabled ? 'text-slate-400' : 'text-indigo-600'}
			/>
			{!collapsed && label}
		</button>
	);
};
export default ToolItem;
