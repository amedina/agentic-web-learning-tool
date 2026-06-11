/**
 * External dependencies
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Internal dependencies
 */
import ToolConfig from "./toolConfig";

const meta = {
  title: "Extension/Tools/JSTools/OutputTools/FileCreator/ToolConfig",
  component: ToolConfig,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} as Meta<typeof ToolConfig>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    config: {
      title: "Create File",
      filename: "data.txt",
    },
  },
};

export const Empty: Story = {
  args: {
    config: {
      title: "Create File",
      filename: "",
    },
  },
};
