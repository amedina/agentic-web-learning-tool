/**
 * External dependencies
 */
import { useCallback, useState } from 'react';
import {
	Portal as DialogPortal,
	Content as DialogContent,
	DialogClose,
	Description as DialogDescription,
	Overlay as DialogOverlay,
	Title as DialogTitle,
} from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useModelProvider } from '../../providers';

const inputStyles = `
  w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg 
  text-[13px] text-stone-700 placeholder:text-stone-400 
  focus:outline-none focus:ring-2 focus:ring-stone-200 focus:bg-white
  transition-all duration-200
`;

type ModelDialogProps = {
	dialogType: 'custom' | 'apiKey';
	setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handlePostAPIKey: (providerId: string, modelId: string) => void;
    modelId: string;
    model: string;
};

export default function ModelDialog({
	dialogType = 'custom',
	setIsDialogOpen,
    handlePostAPIKey,
    modelId,
    model
}: ModelDialogProps) {
	const [customConfig, setCustomConfig] = useState({
		modelConfig: {},
		baseUrl: '',
	});

	const [apiKey, _setApiKey] = useState('');
	const { handleCustomConfig, setApiKey } = useModelProvider(
		({ actions }) => ({
			handleCustomConfig: actions.handleCustomConfig,
			setApiKey: actions.setApiKey,
		})
	);

	const handleAddCustomModel = useCallback(() => {
		if (!customConfig.modelConfig || !customConfig.baseUrl) {
			return;
		}

		handleCustomConfig(customConfig.baseUrl, customConfig.modelConfig);
		setIsDialogOpen(false);
	}, []);

	const handleAddAPIKey = useCallback(() => {
		if (!apiKey) {
			return;
		}
		setApiKey(apiKey);
        handlePostAPIKey(modelId, model);
		setIsDialogOpen(false);
	}, [apiKey]);

	if (dialogType === 'custom') {
		return (
			<DialogPortal>
				<DialogOverlay className="fixed inset-0 bg-black/10 backdrop-blur-sm data-[state=open]:animate-overlayShow z-50" />
				<DialogContent className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-[0_10px_38px_-10px_rgba(22,23,24,0.35),0_10px_20px_-15px_rgba(22,23,24,0.2)] focus:outline-none data-[state=open]:animate-contentShow z-50 font-sans border border-stone-100">
					<div className="flex items-center justify-between mb-5">
						<DialogTitle className="text-lg font-serif font-medium text-stone-900">
							Add Custom Model
						</DialogTitle>
						<DialogClose asChild>
							<button className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-md hover:bg-stone-100">
								<X className="w-4 h-4" />
							</button>
						</DialogClose>
					</div>

					<DialogDescription className="text-stone-500 text-sm mb-5 leading-relaxed">
						Configure a compatible OpenAI-provider (like Ollama, LM
						Studio, or a private endpoint).
					</DialogDescription>

					<div className="space-y-4">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
								Base URL
							</label>
							<input
								className={inputStyles}
								placeholder="e.g. http://localhost:11434/v1"
								value={customConfig.baseUrl}
								onChange={(e) =>
									setCustomConfig({
										...customConfig,
										baseUrl: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
								Custom Headers{' '}
								<span className="text-stone-300 font-normal normal-case">
									(Optional)
								</span>
							</label>
							<input
								className={inputStyles}
								placeholder="Headers to be sent via REST"
								value={JSON.stringify(customConfig.modelConfig, null, 2)}
								onChange={(e) =>
									setCustomConfig({
										...customConfig,
										modelConfig: JSON.parse(e.target.value),
									})
								}
							/>
						</div>
					</div>

					<div className="mt-6 flex justify-end gap-3">
						<DialogClose asChild>
							<button className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
								Cancel
							</button>
						</DialogClose>
						<button
							onClick={handleAddCustomModel}
							disabled={!customConfig.baseUrl}
							className="px-4 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
						>
							Save Configuration
						</button>
					</div>
				</DialogContent>
			</DialogPortal>
		);
	}

	return (
		<DialogPortal>
			<DialogOverlay className="fixed inset-0 bg-black/10 backdrop-blur-sm data-[state=open]:animate-overlayShow z-50" />
			<DialogContent className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-[0_10px_38px_-10px_rgba(22,23,24,0.35),0_10px_20px_-15px_rgba(22,23,24,0.2)] focus:outline-none data-[state=open]:animate-contentShow z-50 font-sans border border-stone-100">
				<div className="flex items-center justify-between mb-5">
					<DialogTitle className="text-lg font-serif font-medium text-stone-900">
						Add API Key
					</DialogTitle>
					<DialogClose asChild>
						<button className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-md hover:bg-stone-100">
							<X className="w-4 h-4" />
						</button>
					</DialogClose>
				</div>

				<DialogDescription className="text-stone-500 text-sm mb-5 leading-relaxed">
					Add API Key for a cloud hosted model
				</DialogDescription>

				<div className="space-y-4">
					<div className="space-y-1">
						<label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
							Api Key
						</label>
						<input
							className={inputStyles}
							placeholder="sk-..."
							value={apiKey}
							onChange={(e) => _setApiKey(e.target.value)}
						/>
					</div>
				</div>

				<div className="mt-6 flex justify-end gap-3">
					<DialogClose asChild>
						<button className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
							Cancel
						</button>
					</DialogClose>
					<button
						onClick={handleAddAPIKey}
						disabled={!apiKey}
						className="px-4 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
					>
						Save Configuration
					</button>
				</div>
			</DialogContent>
		</DialogPortal>
	);
}
