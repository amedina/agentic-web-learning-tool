/**
 * External dependencies
 */
import { useState } from 'react';
import {
	Root as DropDownMenuRoot,
	DropdownMenuTrigger,
	Portal as DropDownMenuPortal,
	Content as DropDownMenuContent,
	Label as DropDownMenuLabel,
	Item as DropDownMenuItem,
	Separator as DropDownMenuSeprator,
	Sub as DropDownMenuSub,
	SubContent as DropDownMenuSubContent,
	SubTrigger as DropDownMenuSubTrigger,
} from '@radix-ui/react-dropdown-menu';
import {
	Root as DialogRoot,
	Trigger as DialogTrigger,
	Portal as DialogPortal,
	Content as DialogContent,
	DialogClose,
	Description as DialogDescription,
	Overlay as DialogOverlay,
	Title as DialogTitle,
} from '@radix-ui/react-dialog';
import { ChevronRight, CpuIcon, X } from 'lucide-react';

/**
 * Internal dependencies
 */
import { INITIAL_PROVIDERS } from '../../constants';

const itemStyles = `
  group relative flex items-center h-9 px-2.5 
  text-[13px] font-medium leading-none text-stone-600 
  rounded-[6px] outline-none select-none cursor-default
  data-[highlighted]:bg-stone-100 data-[highlighted]:text-stone-900
  transition-colors duration-200
`;

const menuContentStyles = `
  min-w-[240px] max-h-[300px] overflow-y-auto overflow-x-hidden
  bg-dark-brown rounded-xl p-[5px]
  border border-stone-200/80 
  shadow-[0_10px_38px_-10px_rgba(22,23,24,0.35),0_10px_20px_-15px_rgba(22,23,24,0.2)]
  will-change-[opacity,transform]
  data-[side=top]:animate-slideDownAndFade 
  data-[side=right]:animate-slideLeftAndFade 
  data-[side=bottom]:animate-slideUpAndFade 
  data-[side=left]:animate-slideRightAndFade
  z-50
  
  /* Custom Scrollbar Styling for Claude Theme */
  [&::-webkit-scrollbar]:w-1.5
  [&::-webkit-scrollbar-track]:bg-transparent
  [&::-webkit-scrollbar-thumb]:bg-stone-200
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:hover:bg-stone-300
`;

const inputStyles = `
  w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg 
  text-[13px] text-stone-700 placeholder:text-stone-400 
  focus:outline-none focus:ring-2 focus:ring-stone-200 focus:bg-white
  transition-all duration-200
`;

type Model = { id: string; label: string };
type Provider = { id: string; name: string; models: Model[] };

export default function ModelSelectorDropDown() {
	const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
	const [selected, setSelected] = useState<{
		provider: string;
		modelId: string;
		modelName: string;
	} | null>({
		provider: 'browser-ai',
		modelId: 'prompt-api',
		modelName: 'Prompt API'
	});
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Form State for Custom Model
	const [customConfig, setCustomConfig] = useState({
		providerName: '',
		modelId: '',
		baseUrl: '',
	});

	const handleSelect = (
		providerName: string,
		modelId: string,
		modelName: string
	) => {
		setSelected({ provider: providerName, modelId, modelName });
	};

	const handleAddCustomModel = () => {
		if (!customConfig.providerName || !customConfig.modelId) return;

		const newProvider: Provider = {
			id: customConfig.providerName.toLowerCase().replace(/\s/g, '-'),
			name: customConfig.providerName,
			models: [{ id: customConfig.modelId, label: customConfig.modelId }],
		};

		setProviders([...providers, newProvider]);
		setIsDialogOpen(false);
		setCustomConfig({ providerName: '', modelId: '', baseUrl: '' });
	};

	return (
		<DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<div className="flex flex-col items-center justify-center font-sans">
				<DropDownMenuRoot>
					<DropdownMenuTrigger asChild>
						<CpuIcon className="w-4 h-4" />
					</DropdownMenuTrigger>

					<DropDownMenuPortal>
						<DropDownMenuContent
							className={menuContentStyles}
							sideOffset={5}
						>
							<DropDownMenuLabel className="px-2.5 py-2 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
								Providers
							</DropDownMenuLabel>

							{providers.map((provider) => (
								<DropDownMenuSub key={provider.id}>
									<DropDownMenuSubTrigger
										className={itemStyles}
									>
										<div className="flex items-center gap-3">
											<span>{provider.name}</span>
										</div>
										<ChevronRight className="ml-auto w-3.5 h-3.5 text-stone-400" />
									</DropDownMenuSubTrigger>

									<DropDownMenuPortal>
										<DropDownMenuSubContent
											className={menuContentStyles}
											sideOffset={8}
											alignOffset={-5}
										>
											<DropDownMenuLabel className="px-2.5 py-2 text-[11px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 mb-1">
												{provider.name} Models
											</DropDownMenuLabel>
											<div className='h-full w-full'>
											{provider.models.map((model) => (
												<DropDownMenuItem
													key={model.id}
													className={itemStyles}
													onSelect={() =>
														handleSelect(
															provider.name,
															model.id,
															model.label
														)
													}
												>
													{model.label}
													{selected?.modelId ===
														model.id && (
														<div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-600" />
													)}
												</DropDownMenuItem>
											))}
											</div>
										</DropDownMenuSubContent>
									</DropDownMenuPortal>
								</DropDownMenuSub>
							))}

							<DropDownMenuSeprator className="h-[1px] bg-stone-100 m-[5px]" />

							{/* Trigger for the Dialog */}
							<DialogTrigger asChild>
								<DropDownMenuItem
									className={itemStyles}
									onSelect={(event) => event.preventDefault()} // Prevent dropdown from closing immediately
								>
									<div className="flex items-center gap-2 text-stone-500">
										<span>Add Custom Model</span>
									</div>
								</DropDownMenuItem>
							</DialogTrigger>
						</DropDownMenuContent>
					</DropDownMenuPortal>
				</DropDownMenuRoot>

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
							Configure a compatible OpenAI-provider (like Ollama,
							LM Studio, or a private endpoint).
						</DialogDescription>

						<div className="space-y-4">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
									Provider Name
								</label>
								<input
									className={inputStyles}
									placeholder="e.g. Local Ollama"
									value={customConfig.providerName}
									onChange={(e) =>
										setCustomConfig({
											...customConfig,
											providerName: e.target.value,
										})
									}
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
									Model ID
								</label>
								<input
									className={inputStyles}
									placeholder="e.g. llama3:latest"
									value={customConfig.modelId}
									onChange={(e) =>
										setCustomConfig({
											...customConfig,
											modelId: e.target.value,
										})
									}
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
									Base URL{' '}
									<span className="text-stone-300 font-normal normal-case">
										(Optional)
									</span>
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
						</div>

						<div className="mt-6 flex justify-end gap-3">
							<DialogClose asChild>
								<button className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
									Cancel
								</button>
							</DialogClose>
							<button
								onClick={handleAddCustomModel}
								disabled={
									!customConfig.providerName ||
									!customConfig.modelId
								}
								className="px-4 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
							>
								Save Configuration
							</button>
						</div>
					</DialogContent>
				</DialogPortal>
			</div>
		</DialogRoot>
	);
}
