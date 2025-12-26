/**
 * External dependencies
 */
import { useCallback, useMemo, type PropsWithChildren } from 'react';
import {
	Root as DropDownMenuRoot,
	DropdownMenuTrigger,
	Portal as DropDownMenuPortal,
	Content as DropDownMenuContent,
	Label as DropDownMenuLabel,
	Item as DropDownMenuItem,
	SubTrigger as DropdownMenuSubTrigger,
	SubContent as DropdownMenuSubContent,
	Sub as DropdownMenuSub,
} from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';

const itemStyles = `
  group relative flex items-center h-9 px-2.5 w-full
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

type DropDownProps = PropsWithChildren & {
	options: DropdownOptions;
	onSelect: (value: string) => void;
	label?: string;
	selectedValue: string;
	placeholder?: string;
	mainLabel?: string;
};

export interface DropdownOption {
	label: string;
	submenu?: DropdownOptions;
	id: string;
	mainLabel?: string;
}

export interface DropdownGroupOption {
	key: string | number;
	group?: string;
	hideLabel?: boolean;
	items: DropdownOption[];
}

export type DropdownOptions = (DropdownOption | DropdownGroupOption)[];

export default function DropDown({
	options,
	onSelect,
	selectedValue,
	children,
	placeholder,
	mainLabel,
}: DropDownProps) {
	const normalizeDropdownItem = useCallback(
		(option: DropdownOption): DropdownOption => {
			return {
				label: option.label,
				submenu: option.submenu,
				id: option.id,
				mainLabel: option.mainLabel,
			};
		},
		[]
	);

	const filterAndNormalizeOptions = useCallback(
		(opts: DropdownOptions): DropdownOption[] => {
			return (opts || [])
				.filter(Boolean)
				.filter((option) => !('group' in option))
				.map((option) =>
					normalizeDropdownItem(option as DropdownOption)
				);
		},
		[normalizeDropdownItem]
	);

	const processOptionsIntoGroups = useCallback(
		(opts: DropdownOptions): DropdownGroupOption[] => {
			const groups: DropdownGroupOption[] = [];
			let currentGroup: DropdownGroupOption | null = null;
			let i = 0;

			for (const option of opts) {
				if (option == null) {
					continue;
				}

				if ('group' in option) {
					if (currentGroup && currentGroup.items.length > 0) {
						groups.push(currentGroup);
						currentGroup = null;
					}
					const groupOption: DropdownGroupOption = {
						...option,
						key: `group-${i}`,
						items: filterAndNormalizeOptions(option.items),
					} as DropdownGroupOption;
					groups.push(groupOption);
				} else {
					if (!currentGroup) {
						currentGroup = {
							key: `nogroup-${i}`,
							group: '',
							hideLabel: true,
							items: [],
						};
					}
					const normalizedItems = filterAndNormalizeOptions([option]);
					if (normalizedItems.length > 0) {
						currentGroup.items.push(...normalizedItems);
					}
				}
				i++;
			}

			if (currentGroup && currentGroup.items.length > 0) {
				groups.push(currentGroup);
			}

			return groups;
		},
		[filterAndNormalizeOptions]
	);

	const renderDropdownItem = (item: DropdownOption) => {
		if (item.submenu) {
			return (
				<DropdownMenuSub>
					<DropdownMenuSubTrigger asChild>
						<DropDownMenuItem
							key={item.id}
							className={itemStyles}
							onClick={() => handleSelect(item.id)}
						>
							<div className="flex items-center gap-3">
								{selectedValue === item.id && (
									<div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-600" />
								)}
								<span>{item.label}</span>
							</div>
						</DropDownMenuItem>
					</DropdownMenuSubTrigger>
					<DropDownMenuPortal>
						<DropdownMenuSubContent
							className={menuContentStyles}
							sideOffset={4}
						>
							{item.mainLabel && (
								<DropDownMenuLabel className="px-2.5 py-2 w-full text-stone-400">
									{item.mainLabel}
								</DropDownMenuLabel>
							)}
							{processOptionsIntoGroups(item.submenu).map(
								(submenuGroup) => (
									<div key={submenuGroup.key}>
										{submenuGroup.group &&
											!submenuGroup.hideLabel && (
												<DropDownMenuLabel className="px-2.5 py-2 text-[11px] w-full  font-bold text-stone-400 uppercase tracking-widest">
													{submenuGroup.group}
												</DropDownMenuLabel>
											)}
										{submenuGroup.items.map((subItem) => (
											<DropDownMenuItem
												key={subItem.label}
												asChild
												onSelect={() =>
													handleSelect(subItem.id)
												}
											>
												{renderDropdownItem(subItem)}
											</DropDownMenuItem>
										))}
									</div>
								)
							)}
						</DropdownMenuSubContent>
					</DropDownMenuPortal>
				</DropdownMenuSub>
			);
		} else {
			return (
				<DropDownMenuItem
					key={item.id}
					className={itemStyles}
					onClick={() => handleSelect(item.id)}
				>
					<div className="flex items-center gap-3">
						{selectedValue === item.id && (
							<div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-600" />
						)}
						<span>{item.label}</span>
					</div>
				</DropDownMenuItem>
			);
		}
	};

	const groups = useMemo(
		() => processOptionsIntoGroups(options),
		[options, processOptionsIntoGroups]
	);

	const handleSelect = useCallback(
		(selectedValueId: string) => {
			onSelect(selectedValueId);
		},
		[onSelect]
	);

	return (
		<div className="flex flex-col items-center justify-center w-full font-sans">
			<DropDownMenuRoot>
				<DropdownMenuTrigger asChild>
					{children ? (
						children
					) : (
						<div className="flex items-center bg-background text-foreground w-full shadow-sm p-2 rounded">
							<span>
								{groups
									.filter((group) =>
										group.items.find(
											(option) =>
												option.id === selectedValue
										)
									)?.[0]
									?.items.find(
										(item) => item.id === selectedValue
									)?.label ?? placeholder}
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
						{' '}
						{mainLabel && (
							<DropDownMenuLabel className="px-2.5 py-2 w-full text-stone-400">
								{mainLabel}
							</DropDownMenuLabel>
						)}
						{groups.map((group) => (
							<div key={group.key}>
								{group.group && !group.hideLabel && (
									<DropDownMenuLabel className="px-2.5 py-2 text-[11px] w-full text-stone-400 tracking-widest">
										{group.group}
									</DropDownMenuLabel>
								)}
								{group.items.map((item) => (
									<div
										data-testid="dropdown-item"
										key={item.label}
									>
										<DropDownMenuItem
											asChild
											onSelect={() =>
												item?.submenu
													? null
													: handleSelect(item.id)
											}
										>
											{renderDropdownItem(item)}
										</DropDownMenuItem>
									</div>
								))}
							</div>
						))}
					</DropDownMenuContent>
				</DropDownMenuPortal>
			</DropDownMenuRoot>
		</div>
	);
}
