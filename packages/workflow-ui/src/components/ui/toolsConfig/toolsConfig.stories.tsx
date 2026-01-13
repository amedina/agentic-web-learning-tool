import type { Meta, StoryObj } from "@storybook/react-vite";
import ToolsConfig from "./index";

const meta: Meta<typeof ToolsConfig> = {
  title: "Extension/ToolsConfig",
  component: ToolsConfig,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    onLabelChange: () => {},
    onContextChange: () => {},
    onFormChange: () => {},
  },
  argTypes: {
    onLabelChange: {
      description: "Callback function when the label of the tool changes.",
      action: "label changed",
    },
    onContextChange: {
      description: "Callback function when the context of the tool changes.",
      action: "context changed",
    },
    onFormChange: {
      description: "Callback function when the form data of the tool changes.",
      action: "form changed",
    },
    selectedNodeId: {
      description: "The ID of the currently selected node.",
      control: { type: "text" },
    },
    nodeType: {
      description: "The type of the currently selected node.",
      control: { type: "text" },
    },
    nodeLabel: {
      description: "The label of the currently selected node.",
      control: { type: "text" },
    },
    nodeContext: {
      description: "The context of the currently selected node.",
      control: { type: "text" },
    },
    nodeDescription: {
      description: "The description of the currently selected node.",
      control: { type: "text" },
    },
    title: {
      description: "The title of the tools config.",
      control: { type: "text" },
    },
    children: {
      description: "The children of the tools config.",
      control: { type: "text" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToolsConfig>;

export const Empty: Story = {
  args: {
    selectedNodeId: null,
  },
};

export const SelectedWithContext: Story = {
  args: {
    selectedNodeId: "1",
    nodeType: "writerApi",
    nodeLabel: "Writer Tool",
    nodeContext: "Write a blog post about...",
  },
};

export const SelectedWithDescriptionOnly: Story = {
  args: {
    selectedNodeId: "2",
    nodeType: "alertNotification",
    nodeLabel: "Alert",
    nodeDescription: "Show an alert message to the user.",
    onContextChange: undefined, // Hide context editor
  },
};

export const WithChildren: Story = {
  args: {
    selectedNodeId: "3",
    nodeType: "customTool",
    nodeLabel: "Custom Tool",
    nodeContext: "Some context",
    children: (
      <div className="border border-dashed border-slate-300 p-4 rounded text-center text-sm text-slate-500">
        Child Component (Tool Specific Config)
      </div>
    ),
  },
};
