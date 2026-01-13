/**
 * External dependencies
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Internal dependencies
 */
import { withStore } from "../../../../../stories/providerDecorator";
import ToolNode from "./toolNode";

const meta = {
  title: "Extension/Tools/BuiltinAI/ProofreaderApi/ToolNode",
  component: ToolNode,
  parameters: {
    layout: "centered",
    apiStore: {
      nodes: {
        "1": {
          type: "proofreaderApi",
          config: {
            title: "Grammar & Tone Checker",
            description: "Check grammar, spelling, and tone of your text.",
            expectedInputLanguages: ["en", "es", "fr"],
          },
        },
      },
    },
  },
  decorators: [withStore],
  tags: ["autodocs"],
} satisfies Meta<typeof ToolNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
