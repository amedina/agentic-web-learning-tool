/**
 * External dependencies
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Internal dependencies
 */
import ToolConfig from "./toolConfig";

const meta = {
  title: "Extension/Tools/JSTools/InputTools/DomInput/ToolConfig",
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
      title: "Product Price Extractor",
      description:
        "Extracts the current listing price from an Amazon product page.",
      cssSelector: "#corePrice_feature_div .a-offscreen",
      extract: "textContent",
      defaultValue: "0.00",
      isMultiple: false,
    },
  },
};
