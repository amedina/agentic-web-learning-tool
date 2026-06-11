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
  title: "Extension/Tools/JSTools/OutputTools/DomReplacement/ToolNode",
  component: ToolNode,
  parameters: {
    layout: "centered",
    apiStore: {
      nodes: {
        "1": {
          type: "domReplacement",
          config: {
            selector: ".content-area",
            description: "Replaces main content",
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
