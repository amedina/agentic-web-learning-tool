import type { Meta, StoryObj } from "@storybook/react";
import { SecurityAdvisories } from "../securityAdvisories";

const meta = {
  title: "Popup/Widgets/SecurityAdvisories",
  component: SecurityAdvisories,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SecurityAdvisories>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    securityAdvisories: {
      issues: [
        {
          summary: "Prototype Pollution in example-lib",
          severity: "high",
          url: "https://github.com/advisories/GHSA-1234",
        },
        {
          summary: "Denial of Service",
          severity: "critical",
          url: "https://github.com/advisories/GHSA-5678",
        },
      ],
    },
  },
};
