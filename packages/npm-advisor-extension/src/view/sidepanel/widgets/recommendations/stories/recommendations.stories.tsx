import type { Meta, StoryObj } from "@storybook/react";
import { Recommendations } from "../recommendations";

const meta = {
  title: "Popup/Widgets/Recommendations",
  component: Recommendations,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Recommendations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    recommendations: {
      nativeReplacements: [
        {
          id: "Array.prototype.find",
          description: "Use native Array.find() instead of lodash.find",
          example: "users.find(u => u.id === id)",
        },
      ],
      microUtilityReplacements: [],
      preferredReplacements: [
        {
          id: "date-fns",
          description: "Consider date-fns over moment for better tree-shaking.",
          replacementModule: "date-fns",
        },
      ],
    },
  },
};
