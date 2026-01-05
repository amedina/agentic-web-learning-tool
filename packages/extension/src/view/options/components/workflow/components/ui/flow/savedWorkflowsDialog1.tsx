import React, { useEffect, useState } from 'react';
import { X, FolderOpen, Trash2, Clock } from 'lucide-react';
import {
	listWorkflows,
	deleteWorkflow,
	type WorkflowMetadata,
} from '../../../../../utils/storage';

interface SavedWorkflowsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onLoad: (id: string) => void;
}

const SavedWorkflowsDialog: React.FC<SavedWorkflowsDialogProps> = ({
	isOpen,
	onClose,
	onLoad,
}) => {
	const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchWorkflows = async () => {
		setIsLoading(true);
		try {
			const list = await listWorkflows();
			setWorkflows(list);
		} catch (error) {
			console.error('Failed to list workflows:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			fetchWorkflows();
		}
	}, [isOpen]);

	const handleDelete = async (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		if (
			window.confirm(
				'Are you sure you want to delete this workflow? This cannot be undone.'
			)
		) {
			await deleteWorkflow(id);
			await fetchWorkflows();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
				<div className="flex items-center justify-between p-6 border-b border-gray-100">
					<div>
						<h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
							<FolderOpen className="text-indigo-600" />
							Saved Workflows
						</h2>
						<p className="text-sm text-gray-500 mt-1">
							Manage your saved workflows
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center h-full text-gray-400">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
							<p>Loading workflows...</p>
						</div>
					) : workflows.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-200 rounded-lg py-12">
							<FolderOpen size={48} className="mb-4 opacity-50" />
							<p className="font-medium">
								No saved workflows found
							</p>
							<p className="text-sm">
								Create a new workflow to get started
							</p>
						</div>
					) : (
						<div className="grid gap-3">
							{workflows.map((workflow) => (
								<div
									key={workflow.id}
									onClick={() => {
										onLoad(workflow.id);
										onClose();
									}}
									className="group relative flex items-center justify-between p-4 bg-gray-50 hover:bg-white border border-gray-200 hover:border-indigo-300 rounded-lg transition-all cursor-pointer hover:shadow-md"
								>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 truncate transition-colors">
											{workflow.name ||
												'Untitled Workflow'}
										</h3>
										<div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
											<span className="flex items-center gap-1">
												<Clock size={12} />
												{new Date(
													workflow.savedAt
												).toLocaleDateString()}{' '}
												{new Date(
													workflow.savedAt
												).toLocaleTimeString()}
											</span>
											{workflow.description && (
												<span className="truncate max-w-[200px]">
													{workflow.description}
												</span>
											)}
										</div>
									</div>

									<button
										onClick={(e) =>
											handleDelete(e, workflow.id)
										}
										className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
										title="Delete workflow"
									>
										<Trash2 size={18} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SavedWorkflowsDialog;
