import type { Meta, StoryObj } from "@storybook/react";
import { BundleFootprint } from "../bundleFootprint";

const meta = {
  title: "Popup/Widgets/BundleFootprint",
  component: BundleFootprint,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof BundleFootprint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    bundle: {
      size: 154000,
      gzip: 42000,
      isTreeShakeable: true,
      hasSideEffects: false,
    },
  },
};

export const WithSideEffects: Story = {
  args: {
    bundle: {
      size: 512000,
      gzip: 128000,
      isTreeShakeable: false,
      hasSideEffects: ["index.js", "styles.css"],
    },
  },
};
