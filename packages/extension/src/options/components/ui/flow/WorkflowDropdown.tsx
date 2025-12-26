import React, { useState, useRef, useEffect } from 'react';
import {
	ChevronDown,
	Plus,
	Upload,
	Download,
	Trash2,
	Workflow,
} from 'lucide-react';

interface WorkflowDropdownProps {
	onNew: () => void;
	onImport: () => void;
	onExport: () => void;
	onClear: () => void;
}

const WorkflowDropdown: React.FC<WorkflowDropdownProps> = ({
	onNew,
	onImport,
	onExport,
	onClear,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const handleAction = (action: () => void) => {
		action();
		setIsOpen(false);
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all rounded shadow-sm border ${
					isOpen
						? 'bg-slate-100 border-slate-300 text-slate-900 shadow-inner'
						: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
				}`}
				title="Workflow Actions"
			>
				<Workflow
					size={16}
					className={isOpen ? 'text-indigo-600' : 'text-slate-400'}
				/>
				<span>Workflow</span>
				<ChevronDown
					size={14}
					className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
					<button
						onClick={() => handleAction(onNew)}
						className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
					>
						<Plus
							size={16}
							className="text-slate-400 group-hover:text-indigo-500 transition-colors"
						/>
						<span className="font-medium">New Workflow</span>
					</button>

					<button
						onClick={() => handleAction(onImport)}
						className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
					>
						<Upload
							size={16}
							className="text-slate-400 group-hover:text-indigo-500 transition-colors"
						/>
						<span className="font-medium">Import JSON</span>
					</button>

					<button
						onClick={() => handleAction(onExport)}
						className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
					>
						<Download
							size={16}
							className="text-slate-400 group-hover:text-indigo-500 transition-colors"
						/>
						<span className="font-medium">Export JSON</span>
					</button>

					<div className="h-px bg-slate-100 my-1 mx-2" />

					<button
						onClick={() => handleAction(onClear)}
						className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors group"
					>
						<Trash2
							size={16}
							className="text-red-400 group-hover:text-red-500 transition-colors"
						/>
						<span className="font-medium">Clear Canvas</span>
					</button>
				</div>
			)}
		</div>
	);
};

export default WorkflowDropdown;
