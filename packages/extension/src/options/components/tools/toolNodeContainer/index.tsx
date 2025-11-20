import type { PropsWithChildren } from 'react';

interface ToolNodeContainerProps {
	title: string;
	type: string;
}

const ToolNodeContainer = ({
	children,
	title,
	type,
}: PropsWithChildren<ToolNodeContainerProps>) => {
	return (
		<div className="bg-white w-3xs h-fit border border-gray-300 rounded-xl divide-y divide-gray-200">
			<div className="p-4">
				<span className="text-2xl font-semibold">{title}</span> ({type})
			</div>
			<div className='p-4'>{children}</div>
		</div>
	);
};

export default ToolNodeContainer;
