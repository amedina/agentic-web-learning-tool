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
  title: "Extension/Tools/JSTools/OutputTools/TextToSpeech/ToolNode",
  component: ToolNode,
  parameters: {
    layout: "centered",
    apiStore: {
      nodes: {
        "1": {
          type: "textToSpeech",
          config: {
            description: "Speaks the input text",
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
