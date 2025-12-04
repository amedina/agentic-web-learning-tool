/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import TooltipComponent from './tooltip';
import { Button } from '../button';

const meta: Meta<typeof TooltipComponent> = {
	title: 'ui/Tooltip',
	component: TooltipComponent,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		placement: {
			control: 'select',
			options: ['top', 'bottom', 'left', 'right'],
		},
	},
};

export default meta;
type Story = StoryObj<typeof TooltipComponent>;

export const WithText: Story = {
  render: (args) => {
    return (
      <TooltipComponent text={args.text} placement={args.placement}>
        <Button>Delete</Button>
      </TooltipComponent>
    );
  },
  args: {
    text: "This action cannot be undone",
    placement: "top",
    body: null,
  },
};
