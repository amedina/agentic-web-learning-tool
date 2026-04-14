import type { Meta, StoryObj } from "@storybook/react";
import { Responsiveness } from "../responsiveness";

const meta = {
  title: "Popup/Widgets/Responsiveness",
  component: Responsiveness,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Responsiveness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    responsiveness: {
      description: "Highly Responsive",
      closedIssuesRatio: 0.85,
      openIssuesCount: 42,
      issuesUrl: "https://github.com/facebook/react/issues",
    },
  },
};
