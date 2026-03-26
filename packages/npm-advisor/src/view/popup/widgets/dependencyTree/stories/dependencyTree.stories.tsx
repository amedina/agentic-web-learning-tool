import type { Meta, StoryObj } from "@storybook/react";
import { DependencyTree } from "../dependencyTree";

const meta = {
  title: "Popup/Widgets/DependencyTree",
  component: DependencyTree,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DependencyTree>;

export default meta;
type Story = StoryObj<typeof meta>;

const dummyTree = {
  name: "react",
  requestedVersion: "^18.2.0",
  resolvedVersion: "18.2.0",
  dependencies: {
    "loose-envify": {
      name: "loose-envify",
      requestedVersion: "^1.1.0",
      resolvedVersion: "1.4.0",
      dependencies: {
        "js-tokens": {
          name: "js-tokens",
          requestedVersion: "^3.0.0 || ^4.0.0",
          resolvedVersion: "4.0.0",
          dependencies: {},
        },
      },
    },
  },
};

export const Default: Story = {
  args: {
    dependencyTree: dummyTree,
  },
};
