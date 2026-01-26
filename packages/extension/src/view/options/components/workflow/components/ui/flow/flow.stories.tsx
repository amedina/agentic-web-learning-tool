import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEdgesState, useNodesState } from '@xyflow/react';
import Flow from './index';
import { useCallback } from 'react';

const meta: Meta<typeof Flow> = {
  title: 'Extension/Flow',
  component: Flow,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    nodes: {
      control: 'object',
      description: 'Array of nodes for the flow.',
      table: { type: { summary: 'Node[]' } },
    },
    edges: {
      control: 'object',
      description: 'Array of edges connecting nodes in the flow.',
      table: { type: { summary: 'Edge[]' } },
    },
    nodeTypes: {
      control: 'object',
      description: 'Object of node types for the flow.',
      table: { type: { summary: 'NodeTypes' } },
    },
    onNodesChange: {
      action: 'nodes changed',
      description: 'Callback function for when nodes change.',
      table: { type: { summary: 'OnNodesChange' } },
    },
    onEdgesChange: {
      action: 'edges changed',
      description: 'Callback function for when edges change.',
      table: { type: { summary: 'OnEdgesChange' } },
    },
    onConnect: {
      action: 'connect',
      description: 'Callback function for when two nodes are connected.',
      table: { type: { summary: 'OnConnect' } },
    },
    title: {
      control: 'text',
      description: 'The title of the workflow.',
      table: { type: { summary: 'string' } },
    },
    onTitleChange: {
      action: 'title changed',
      description: 'Callback function for when the workflow title changes.',
      table: { type: { summary: '(title: string) => void' } },
    },
    actions: {
      control: 'object',
      description: 'Actions to be displayed in the flow header.',
      table: { type: { summary: 'object | React.ReactNode' } },
    },
    onNodesDelete: {
      action: 'nodes deleted',
      description: 'Callback function for when nodes are deleted.',
      table: { type: { summary: 'OnNodesDelete' } },
    },
    onEdgesDelete: {
      action: 'edges deleted',
      description: 'Callback function for when edges are deleted.',
      table: { type: { summary: 'OnEdgesDelete' } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Flow>;

const FlowWithHooks = (args: any) => {
  const [nodes, , onNodesChange] = useNodesState(args.nodes || []);
  const [edges, , onEdgesChange] = useEdgesState(args.edges || []);

  const onConnect = useCallback(() => {}, []);

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <Flow
        {...args}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <FlowWithHooks {...args} />,
  args: {
    title: 'Untitled Workflow',
    isStopping: false,
    onTitleChange: () => {},
    actions: {
      onImport: () => {},
      onExport: () => {},
      onClear: () => {},
      onNew: () => {},
      onRun: () => {},
      onStop: () => {},
      onDrop: () => {},
      onLoadSaved: () => {},
    },
    nodes: [
      {
        id: '1',
        type: 'input',
        data: { label: 'Input Node' },
        position: { x: 250, y: 25 },
      },
      {
        id: '2',
        data: { label: 'Default Node' },
        position: { x: 100, y: 125 },
      },
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }],
  },
};
