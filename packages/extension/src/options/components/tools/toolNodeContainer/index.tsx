import { Pen } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface ToolNodeContainerProps {
	title: string;
	type: string;
	onEdit: () => void;
}

const ToolNodeContainer = ({
	children,
	title,
	type,
	onEdit,
}: PropsWithChildren<ToolNodeContainerProps>) => {
	return (
		<div className="bg-white w-[300px] h-fit border border-gray-300 rounded-xl divide-y divide-gray-200">
			<div className="p-4 flex justify-between items-center">
				<p>
					<span className="text-2xl font-semibold">{title}</span> (
					{type})
				</p>
				<Pen
					width={16}
					height={16}
					className="hover:opacity-80"
					onClick={onEdit}
				/>
			</div>
			<div className="p-4">{children}</div>
		</div>
	);
};

export default ToolNodeContainer;
