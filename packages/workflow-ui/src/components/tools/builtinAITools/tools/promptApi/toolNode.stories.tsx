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
  title: "Extension/Tools/BuiltinAI/PromptApi/ToolNode",
  component: ToolNode,
  parameters: {
    layout: "centered",
    apiStore: {
      nodes: {
        "1": {
          type: "promptApi",
          config: {
            title: "Generate Summary",
            context:
              "Please provide a concise 3-sentence summary of the following legal document, focusing on the key obligations and deadlines.",
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
