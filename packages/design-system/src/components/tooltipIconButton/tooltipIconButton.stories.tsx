import type { Meta, StoryObj } from '@storybook/react-vite';
import { TooltipIconButton } from './tooltipIconButton';
import { Plus, Trash2, Info } from 'lucide-react';

const meta: Meta<typeof TooltipIconButton> = {
	title: 'Components/TooltipIconButton',
	component: TooltipIconButton,
	tags: ['autodocs'],
	argTypes: {
		side: {
			control: 'select',
			options: ['top', 'bottom', 'left', 'right'],
		},
	},
};

export default meta;
type Story = StoryObj<typeof TooltipIconButton>;

export const Default: Story = {
	args: {
		tooltip: 'Add Item',
		children: <Plus className="size-4" />,
	},
};

export const Destructive: Story = {
	args: {
		tooltip: 'Delete',
		side: 'right',
		className: 'text-red-500 hover:text-red-600 hover:bg-red-100',
		children: <Trash2 className="size-4" />,
	},
};

export const AllSides: Story = {
	render: () => (
		<div className="w-full h-[300px]">
			<div className="flex flex-col items-center justify-center gap-4 p-10">
				<TooltipIconButton tooltip="Top" side="top">
					<Info className="size-4" />
				</TooltipIconButton>
				<TooltipIconButton tooltip="Bottom" side="bottom">
					<Info className="size-4" />
				</TooltipIconButton>
				<TooltipIconButton tooltip="Left" side="left">
					<Info className="size-4" />
				</TooltipIconButton>
				<TooltipIconButton tooltip="Right" side="right">
					<Info className="size-4" />
				</TooltipIconButton>
			</div>
		</div>
	),
};
