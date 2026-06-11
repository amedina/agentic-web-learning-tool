/**
 * External dependencies
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings } from "lucide-react";

/**
 * Internal dependencies
 */
import ToolItem from ".";

const meta = {
  title: "Extension/ToolItem",
  component: ToolItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onClick: {
      action: "onClick",
      description:
        "Callback function to be called when the tool item is clicked",
    },
    Icon: {
      control: false,
      description: "Icon component to be displayed in the tool item",
    },
    label: {
      control: "text",
      description: "Label to be displayed in the tool item",
    },
  },
} as Meta<typeof ToolItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Standard Tool",
    Icon: Settings,
  },
};
