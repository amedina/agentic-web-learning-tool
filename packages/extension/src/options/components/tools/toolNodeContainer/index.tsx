import { Pen } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface ToolNodeContainerProps {
	title: string;
	type: string;
	selected: boolean;
	onEdit: () => void;
}

const ToolNodeContainer = ({
	children,
	title,
	type,
	selected,
	onEdit,
}: PropsWithChildren<ToolNodeContainerProps>) => {
	return (
		<div
			className={`bg-white w-[300px] h-fit border rounded-xl divide-y divide-gray-200 ${selected ? 'shadow-lg border-blue-500' : 'border-gray-300'}`}
		>
			<div className="p-4 flex justify-between items-center">
				<p>
					<span className="text-2xl font-semibold">{title}</span> (
					{type})
				</p>
				<Pen
					width={24}
					height={24}
					className="hover:opacity-80 cursor-pointer hover:text-blue-500 bg-gray-100 p-1 rounded hover:bg-gray-200"
					onClick={onEdit}
				/>
			</div>
			<div className="p-4">{children}</div>
		</div>
	);
};

export default ToolNodeContainer;
