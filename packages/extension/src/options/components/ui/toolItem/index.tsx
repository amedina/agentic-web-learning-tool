interface ToolItemProps {
	label: string;
	onClick: () => void;
	Icon: React.ComponentType<{ size: number; className?: string }>;
	disabled?: boolean;
	title?: string;
}

const ToolItem = ({ label, onClick, Icon, disabled, title }: ToolItemProps) => {
	return (
		<button
			disabled={disabled}
			title={title}
			className={`w-full flex items-center gap-3 p-3 mb-2 bg-white border border-slate-200 rounded-lg transition-all text-sm font-medium ${
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
			{label}
		</button>
	);
};

export default ToolItem;
