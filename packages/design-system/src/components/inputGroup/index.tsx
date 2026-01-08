/**
 * External dependencies
 */
import type { PropsWithChildren } from 'react';
/**
 * Internal dependencies
 */
import { cn } from '../../lib';

type InputGroupProps = PropsWithChildren & {
	label: string;
	help?: string;
	className?: string;
};
const InputGroup = ({ label, children, help, className }: InputGroupProps) => (
	<div className={cn('space-y-1.5', className)}>
		<label className="block text-[13px] font-medium text-amethyst-haze">
			{label}
		</label>
		{children}
		{help && <p className="text-[11px] text-exclusive-plum">{help}</p>}
	</div>
);

export default InputGroup;
