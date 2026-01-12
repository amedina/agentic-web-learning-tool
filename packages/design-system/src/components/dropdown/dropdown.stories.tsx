/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import DropDown from './';

const modelOptions = [
  { id: 'gpt-4', label: 'GPT-4' },
  { id: 'gpt-3.5', label: 'GPT-3.5 Turbo' },
  { id: 'claude-3', label: 'Claude 3 Opus' },
  { id: 'gemini-pro', label: 'Gemini Pro' },
];

const timezoneOptions = Array.from({ length: 20 }).map((_, i) => ({
  id: `zone-${i}`,
  label: `(UTC ${i - 10}:00) Region/City Name ${i + 1}`,
}));

const meta = {
  title: 'ui/DropDown',
  component: DropDown,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Array of options to display in the menu',
    },
    label: {
      control: 'text',
      description: 'Optional category label shown at the top of the list',
    },
    selectedValue: {
      control: 'select',
      options: modelOptions.map((o) => o.id),
      description: 'The ID of the currently selected option',
    },
    onSelect: { action: 'selected' },
  },
  // Use fn() to spy on the onSelect event in the Actions panel
  args: {
    onSelect: (id) => console.log('Selected Value ', id),
  },
} satisfies Meta<typeof DropDown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: modelOptions,
    selectedValue: 'gpt-4',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'AI Model',
    options: modelOptions,
    selectedValue: 'claude-3',
  },
};

export const LongList: Story = {
  args: {
    label: 'Select Timezone',
    options: timezoneOptions,
    selectedValue: 'zone-5',
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [currentValue, setCurrentValue] = useState(
      args.selectedValue || 'gpt-4'
    );

    const handleSelect = (id: string) => {
      setCurrentValue(id);
      args.onSelect(id);
    };

    return (
      <div className="h-[200px] flex flex-col items-center gap-4">
        <span className="text-sm text-stone-500">
          Current State: <span className="font-bold">{currentValue}</span>
        </span>
        <DropDown
          {...args}
          selectedValue={currentValue}
          onSelect={handleSelect}
        />
      </div>
    );
  },
  args: {
    label: 'Model Selection',
    options: modelOptions,
    selectedValue: 'gpt-4',
  },
};
