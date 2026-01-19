interface ToolItemProps {
	label: string;
	onClick: () => void;
	Icon: React.ComponentType<{ size: number; className?: string }>;
}

const ToolItem = ({ label, onClick, Icon }: ToolItemProps) => {
	return (
		<button
			className="w-full flex items-center gap-3 p-3 mb-2 bg-white border border-slate-200 rounded-lg cursor-grab hover:border-indigo-500 hover:shadow-md transition-all text-slate-700 text-sm font-medium"
			onClick={onClick}
		>
			<Icon size={18} className="text-indigo-600" />
			{label}
		</button>
	);
};

export default ToolItem;
