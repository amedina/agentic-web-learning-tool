/**
 * External dependencies
 */
import type { ToolCallMessagePartComponent } from '@assistant-ui/react';
import {
	ArrowRight,
	Check,
	ChevronDown,
	ChevronRight,
	Code2,
	Loader2,
	Terminal,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { getToolNameWithoutPrefix } from '../../lib';

export const ToolFallback: ToolCallMessagePartComponent = ({
	toolName,
	argsText,
	result,
	status,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [timing, setTiming] = useState('');
	const timingRef = useRef(Date.now());
	// Status config map for easy styling
	const statusConfig = {
		running: {
			badge: 'bg-stone-100 text-amethyst-haze',
			border: 'border-ring',
			icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
			text: 'Processing...',
		},
		complete: {
			badge: 'bg-teal-50 text-teal-700',
			border: 'border-ring',
			icon: <Check className="h-3.5 w-3.5" />,
			text: 'Executed',
		},
		incomplete: {
			badge: 'bg-red-50 text-red-700',
			border: 'border-red-100',
			icon: <div className="h-1.5 w-1.5 rounded-full bg-red-500" />,
			text: 'Failed',
		},
		'requires-action': {
			badge: 'bg-red-50 text-red-700',
			border: 'border-red-100',
			icon: <div className="h-1.5 w-1.5 rounded-full bg-red-500" />,
			//@ts-expect-error -- Some status have reason as well.
			text: status?.reason,
		},
	};

	useEffect(() => {
		if (status.type !== 'running') {
			setTiming(`${(Date.now() - timingRef.current) / 1000}s`);
		}
	}, [status.type]);

	const currentStatus =
		statusConfig?.[status.type as keyof typeof statusConfig];

	return (
		// Outer Container: Simulates the chat stream width
		<div className="font-sans antialiased w-full max-w-3xl mx-auto my-4">
			{/* The Card: White paper look with very subtle shadow */}
			<div
				className={`group relative bg-background overflow-hidden rounded-xl border ${currentStatus?.border} shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out`}
			>
				{/* Header Section */}
				<div
					onClick={() => setIsOpen(!isOpen)}
					className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-sidebar-accent transition-colors"
				>
					<div className="flex items-center gap-3">
						{/* Minimalist Icon Box */}
						<div
							className={`
              flex items-center justify-center h-8 w-8 rounded-lg 
              border
              text-primary
            `}
						>
							<Terminal strokeWidth={1.5} size={16} />
						</div>

						<div className="flex flex-col w-full">
							<div className="flex items-center gap-2">
								<span className="text-lg font-medium text-primary tracking-tight">
									{getToolNameWithoutPrefix(toolName)}
								</span>
								<div
									className={`
                  flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm uppercase mr-2
                  ${currentStatus?.badge}
                `}
								>
									{currentStatus?.icon}
									<span>{currentStatus?.text}</span>
								</div>
								<div className="text-xs font-medium text-exclusive-plum tracking-tight">
									{timing}
								</div>
							</div>
						</div>
					</div>

					<div className="text-stone-400 transition-transform duration-200">
						{isOpen ? (
							<ChevronDown size={18} strokeWidth={1.5} />
						) : (
							<ChevronRight size={18} strokeWidth={1.5} />
						)}
					</div>
				</div>

				{/* Content Area - Warm Gray Background */}
				{isOpen && (
					<div className="border-t border-neutral-800 bg-[#111111]">
						{/* Input Arguments */}
						<div className="px-5 py-4">
							<div className="flex items-center gap-2 mb-2 text-stone-500 text-xs font-medium uppercase tracking-wider">
								<Code2 size={12} /> Arguments
							</div>
							<div className="bg-[#1a1a1a] border border-neutral-800 rounded-lg p-3 shadow-sm">
								<pre className="font-mono text-xs leading-relaxed text-stone-300 overflow-x-auto">
									{JSON.stringify(argsText, null, 2)}
								</pre>
							</div>
						</div>

						{/* Result Output (if available) */}
						{result && (
							<div className="px-5 pb-5 animate-in fade-in slide-in-from-top-1 duration-300">
								<div className="flex items-center gap-2 mb-2 text-stone-500 text-xs font-medium uppercase tracking-wider">
									<ArrowRight size={12} /> Output
								</div>

								{/* The Result Block: Looks like a printed document or strict code block */}
								<div className="relative group/code">
									<div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-700 rounded-l-lg"></div>
									<div className="bg-[#1a1a1a] border border-neutral-800 border-l-0 rounded-r-lg p-3 shadow-sm overflow-x-auto">
										<pre className="font-mono text-xs leading-relaxed text-stone-400">
											{typeof result === 'string'
												? result
												: JSON.stringify(
														result,
														null,
														2
													)}
										</pre>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
