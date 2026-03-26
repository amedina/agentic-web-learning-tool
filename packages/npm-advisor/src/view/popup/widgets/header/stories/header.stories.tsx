import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "../header";

const meta = {
  title: "Popup/Widgets/Header",
  component: Header,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    packageName: "react",
    githubUrl: "https://github.com/facebook/react",
    stars: 213000,
    collaboratorsCount: 154,
    lastCommitDate: new Date().toISOString(),
    license: "MIT",
    onAddToCompare: () => console.log("Added to compare"),
    isAddedToCompare: false,
    score: 95,
  },
};
