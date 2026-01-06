/**
 * External dependencies.
 */
import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, SaveIcon, TrashIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import Input from '../../input';
import type { PromptCommand } from '../types';

interface EditCommandDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	command?: PromptCommand;
	onSave: (command: PromptCommand) => void;
	onDelete?: (command: PromptCommand) => void;
	existingNames?: string[];
}

export function EditCommandDialog({
	open,
	onOpenChange,
	command,
	onSave,
	onDelete,
	existingNames = [],
}: EditCommandDialogProps) {
	const [name, setName] = useState('');
	const [instructions, setInstructions] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		if (open) {
			setName(command ? command.name : '');
			setInstructions(command ? command.instructions : '');
			setError('');
		}
	}, [open, command]);

	const handleSave = () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			setError('Command Name is required');
			return;
		}
		if (!/^[a-zA-Z0-9_\-]+$/.test(trimmedName)) {
			setError(
				'Letters, numbers, hyphens, and underscores only. No slashes or spaces.'
			);
			return;
		}
		if (trimmedName.length > 50) {
			setError('Command Name starts to get too long (max 50 chars).');
			return;
		}
		if (
			existingNames.includes(trimmedName) &&
			trimmedName !== (command?.name || '')
		) {
			setError('Command name already exists. Please choose another.');
			return;
		}
		if (!instructions.trim()) {
			setError('Instructions Template is required');
			return;
		}

		onSave({ name: trimmedName, instructions });
		onOpenChange(false);
	};

	const exampleInput = '/' + (name || 'command') + ' your arguments here';
	// Replace $ARGUMENTS if present, otherwise append
	const exampleOutput = instructions
		? instructions.includes('$ARGUMENTS')
			? instructions.replaceAll('$ARGUMENTS', 'your arguments here')
			: instructions
		: 'Your template here';

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
				<Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[600px] max-w-[95vw] bg-white text-gray-900 border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col p-6 outline-none">
					<div className="flex items-center justify-between mb-6">
						<Dialog.Title className="text-xl font-bold">
							{command ? 'Edit Command' : 'Create Command'}
						</Dialog.Title>
						<Dialog.Close asChild>
							<button className="text-gray-500 hover:text-gray-900 transition-colors">
								<X size={20} />
							</button>
						</Dialog.Close>
					</div>

					<div className="flex flex-col gap-5">
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Command Name
							</label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., react-tutor, summarize-pdf"
							/>
							<p className="text-xs text-gray-500">
								Letters, numbers, hyphens, and underscores only.
								No slashes or spaces. (1-50 characters)
							</p>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Agent Persona & Prompt
							</label>
							<textarea
								value={instructions}
								onChange={(e) =>
									setInstructions(e.target.value)
								}
								className="flex min-h-[120px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
								placeholder="Act as a Socratic tutor. Instead of giving the answer, guide me with hints to solve this problem myself: $ARGUMENTS"
							/>
							<p className="text-xs text-gray-500">
								Use $ARGUMENTS where you want the command
								arguments to be inserted
							</p>
						</div>

						{error && (
							<div className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded border border-red-100">
								{error}
							</div>
						)}

						<div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
							<label className="text-sm font-bold text-gray-800 mb-2 block">
								Example Usage
							</label>
							<div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm items-baseline">
								<span className="font-semibold text-gray-600 text-right min-w-[70px]">
									Input:
								</span>
								<code className="bg-white border border-gray-200 px-2 py-1.5 rounded text-blue-600 font-mono block w-full">
									{exampleInput}
								</code>

								<span className="font-semibold text-gray-600 text-right min-w-[70px]">
									Expands to:
								</span>
								<div className="text-green-700 font-mono text-xs bg-white border border-gray-200 px-2 py-1.5 rounded whitespace-pre-wrap max-h-32 overflow-y-auto w-full leading-relaxed">
									{exampleOutput}
								</div>
							</div>
						</div>

						<div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
							<div>
								{command && onDelete && (
									<Button
										variant="ghost"
										className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 px-2"
										onClick={() => onDelete(command)}
									>
										<TrashIcon size={16} /> Delete
									</Button>
								)}
							</div>
							<Button
								onClick={handleSave}
								className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
							>
								<SaveIcon size={16} /> Save
							</Button>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
