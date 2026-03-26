import type { Meta, StoryObj } from "@storybook/react";
import { LicenseCheck } from "../licenseCheck";

const meta = {
  title: "Popup/Widgets/LicenseCheck",
  component: LicenseCheck,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LicenseCheck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Compatible: Story = {
  args: {
    licenseCompatibility: {
      isCompatible: true,
      explanation: "MIT is fully compatible.",
    },
  },
};

export const Incompatible: Story = {
  args: {
    licenseCompatibility: {
      isCompatible: false,
      explanation: "GPL is not compatible with MIT.",
    },
  },
};
