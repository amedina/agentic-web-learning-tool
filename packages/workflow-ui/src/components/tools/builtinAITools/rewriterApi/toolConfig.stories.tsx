/**
 * External dependencies
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Internal dependencies
 */
import ToolConfig from "./toolConfig";

const meta = {
  title: "Extension/Tools/BuiltinAI/RewriterApi/ToolConfig",
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
      title: "Rewriter API",
      context:
        "Rewrites customer support responses to be more empathetic and solution-oriented.",
      tone: "more-casual",
      format: "plain-text",
      length: "as-is",
      expectedInputLanguages: ["en"],
      outputLanguage: "en",
    },
  },
};
