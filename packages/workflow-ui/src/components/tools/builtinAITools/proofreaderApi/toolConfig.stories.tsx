/**
 * External dependencies
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Internal dependencies
 */
import ToolConfig from "./toolConfig";

const meta = {
  title: "Extension/Tools/BuiltinAI/ProofreaderApi/ToolConfig",
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
      title: "Proofreader API",
      description:
        "Checks for grammar, spelling, and tone consistency in professional emails.",
      expectedInputLanguages: ["en", "es"],
    },
  },
};
