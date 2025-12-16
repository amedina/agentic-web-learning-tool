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
	Separator as DropDownMenuSeprator,
	Sub as DropDownMenuSub,
} from '@radix-ui/react-dropdown-menu';
import {
	Root as DialogRoot,
} from '@radix-ui/react-dialog';
import { Settings2 } from 'lucide-react';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
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
type ToolProps = {
	tools: McpTool[];
}
export default function ToolDropDown({tools}: ToolProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
		<DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<div className="flex flex-col items-center justify-center font-sans">
				<DropDownMenuRoot>
					<DropdownMenuTrigger asChild>
						<TooltipIconButton tooltip={`${tools.length} Tools Available`}>
							<Settings2 className="w-4 h-4 text-foreground" />
						</TooltipIconButton>
					</DropdownMenuTrigger>

					<DropDownMenuPortal>
						<DropDownMenuContent
							className={menuContentStyles}
							sideOffset={5}
						>
							<DropDownMenuLabel className="px-2.5 py-2 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
								Tools
							</DropDownMenuLabel>

							{tools.map((tool) => (
								<DropDownMenuSub key={tool.name}>
									<div className={itemStyles}>
										<div className="flex items-center gap-3">
											<span>{tool.name}</span>
										</div>
									</div>
								</DropDownMenuSub>
								
							))}

							<DropDownMenuSeprator className="h-[1px] bg-stone-100 m-[5px]" />
						</DropDownMenuContent>
					</DropDownMenuPortal>
				</DropDownMenuRoot>
			</div>
		</DialogRoot>
	);
}
