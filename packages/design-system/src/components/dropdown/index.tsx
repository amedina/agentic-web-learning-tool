/**
 * External dependencies
 */
import { useCallback, type PropsWithChildren } from 'react';
import {
	Root as DropDownMenuRoot,
	DropdownMenuTrigger,
	Portal as DropDownMenuPortal,
	Content as DropDownMenuContent,
	Label as DropDownMenuLabel,
	Item as DropDownMenuItem,
} from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';

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

type Option = { id: string; label: string };
type DropDownProps = PropsWithChildren & {
	options: Option[];
	onSelect: (value: string) => void;
	label?: string;
	selectedValue: string;
};

export default function DropDown({
	options,
	onSelect,
	label,
	selectedValue,
	children,
}: DropDownProps) {
	const handleSelect = useCallback(
		(selectedValueId: string) => {
			onSelect(selectedValueId);
		},
		[onSelect]
	);
	console.log(selectedValue)
	return (
		<div className="flex flex-col items-center justify-center font-sans">
			<DropDownMenuRoot>
				<DropdownMenuTrigger asChild>
					{children ? (
						children
					) : (
						<div className="flex items-center bg-background text-foreground shadow-sm p-2 rounded">
							<span>
								{
									options.find(
										(option) => option.id === selectedValue
									)?.label
								}
							</span>
							<ChevronDown className="ml-auto w-3.5 h-3.5 text-stone-400" />
						</div>
					)}
				</DropdownMenuTrigger>

				<DropDownMenuPortal>
					<DropDownMenuContent
						className={menuContentStyles}
						sideOffset={5}
					>
						{label && (
							<DropDownMenuLabel className="px-2.5 py-2 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
								{label}
							</DropDownMenuLabel>
						)}

						{options.map((option) => (
							<DropDownMenuItem
								key={option.id}
								className={itemStyles}
								onClick={() => handleSelect(option.id)}
							>
								<div className="flex items-center gap-3">
									{selectedValue === option.id && (
										<div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-600" />
									)}
									<span>{option.label}</span>
								</div>
							</DropDownMenuItem>
						))}
					</DropDownMenuContent>
				</DropDownMenuPortal>
			</DropDownMenuRoot>
		</div>
	);
}
