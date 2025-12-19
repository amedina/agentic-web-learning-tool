/**
 * External dependencies
 */
import { useCallback, useState } from 'react';
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
} from '@radix-ui/react-dialog';
import { ChevronRight, CpuIcon } from 'lucide-react';

/**
 * Internal dependencies
 */
import { INITIAL_PROVIDERS } from '../../constants';
import { useModelProvider } from '../../providers';
import ModelDialog from '../modelDialog';
import { TooltipIconButton } from '@google-awlt/design-system';

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

type Model = { id: string; label: string };
type Provider = { id: string; name: string; models: Model[] };

export default function ModelSelectorDropDown() {
	const [providers, _setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [dialogType, setDialogType] = useState<'custom' | 'apiKey'>('custom');
	const { modelProvider, llmModel, setSelectedModel } = useModelProvider(
		({ state, actions }) => ({
			modelProvider: state.selectedProvider,
			llmModel: state.selectedModel,
			setSelectedModel: actions.setSelectedModel,
		})
	);
	const [selected, setSelected] = useState<{
		provider: string;
		modelId: string;
	}>({
		provider: modelProvider ?? 'browser-ai',
		modelId: llmModel ?? 'prompt-api',
	});

	const handleSelect = useCallback(
		(providerId: string, modelId: string) => {
			setSelected({ modelId, provider: providerId });
		},
		[setSelectedModel]
	);

	const generateTrigger = useCallback(
		(modelId: string, providerId: string) => {
			if (modelId !== 'prompt-api') {
				return (
					<DialogTrigger asChild key={modelId}>
						<DropDownMenuItem
							key={modelId}
							className={itemStyles}
							onSelect={() => {
								setDialogType('apiKey');
								handleSelect(providerId, modelId);
							}}
						>
							{modelId}
							{llmModel === modelId && (
								<div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-600" />
							)}
						</DropDownMenuItem>
					</DialogTrigger>
				);
			}
			return (
				<DropDownMenuItem
					key={modelId}
					className={itemStyles}
					onSelect={() => {
						handleSelect(providerId, modelId);
						setSelectedModel(modelId, providerId)
					}}
				>
					{modelId}
					{llmModel === modelId && (
						<div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-600" />
					)}
				</DropDownMenuItem>
			);
		},
		[handleSelect]
	);

	return (
		<DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<div className="flex flex-col items-center justify-center font-sans">
				<DropDownMenuRoot>
					<DropdownMenuTrigger asChild>
						<TooltipIconButton tooltip={`Current Model ${ llmModel } from ${ modelProvider }.`}>
							<CpuIcon className="w-4 h-4 text-foreground" />
						</TooltipIconButton>
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
											{modelProvider === provider.id && (
												<div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-600" />
											)}
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
											<div className="h-full w-full">
												{provider.models.map(
													(model) => {
														return generateTrigger(model.id, provider.id);
													}
												)}
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
									onSelect={(event) => {
										event.preventDefault();
										setDialogType('custom');
									}} // Prevent dropdown from closing immediately
								>
									<div className="flex items-center gap-2 text-stone-500">
										<span>Add Custom Model</span>
									</div>
								</DropDownMenuItem>
							</DialogTrigger>
						</DropDownMenuContent>
					</DropDownMenuPortal>
				</DropDownMenuRoot>

				<ModelDialog
					setIsDialogOpen={setIsDialogOpen}
					handlePostAPIKey={() =>
						setSelectedModel(selected.modelId, selected.provider)
					}
					modelId={selected?.provider}
					model={selected?.modelId}
					dialogType={dialogType}
				/>
			</div>
		</DialogRoot>
	);
}
