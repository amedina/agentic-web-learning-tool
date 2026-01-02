/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

/**
 * Toast Props
 */
export interface ToastProps {
	message: string;
	type: 'success' | 'error' | 'info';
	duration?: number;
	onClose: () => void;
}

const Toast = ({ message, type, duration = 3000, onClose }: ToastProps) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
		const timer = setTimeout(() => {
			setIsVisible(false);
			setTimeout(onClose, 500);
		}, duration);

		return () => clearTimeout(timer);
	}, [duration, onClose]);

	const icons = {
		success: <CheckCircle2 size={18} className="text-emerald-500" />,
		error: <AlertCircle size={18} className="text-rose-500" />,
		info: <Loader2 size={18} className="text-indigo-500 animate-spin" />,
	};

	const backgrounds = {
		success: 'bg-emerald-50/90 border-emerald-200/50',
		error: 'bg-rose-50/90 border-rose-200/50',
		info: 'bg-indigo-50/90 border-indigo-200/50',
	};

	return (
		<div
			className={`fixed top-6 left-1/2 -translate-x-1/2 z-9999 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 ease-out flex items-center gap-3 min-w-[320px] max-w-md ${
				backgrounds[type]
			} ${
				isVisible
					? 'opacity-100 translate-y-0 scale-100'
					: 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
			}`}
		>
			<div className="shrink-0">{icons[type]}</div>
			<p className="flex-1 text-sm font-medium text-slate-700 leading-tight">
				{message}
			</p>
			<button
				onClick={() => {
					setIsVisible(false);
					setTimeout(onClose, 300);
				}}
				className="p-1 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
			>
				<X size={14} />
			</button>
		</div>
	);
};

export default Toast;
