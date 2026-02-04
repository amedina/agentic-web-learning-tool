/**
 * External dependencies
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Internal dependencies
 */
import ToolConfig from "./toolConfig";

const meta = {
  title: "Extension/Tools/JSTools/InputTools/StaticInput/ToolConfig",
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
      title: "API Key",
      description:
        "A static API key used for authenticating with external translation services.",
      inputValue: "sk-1234567890abcdef",
    },
  },
};
