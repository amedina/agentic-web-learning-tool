import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	AssistantRuntimeProvider,
	MessagePrimitive,
	useLocalRuntime,
  ThreadPrimitive
} from '@assistant-ui/react';

import { MarkdownText } from './markdownText';

const meta: Meta<typeof MarkdownText> = {
	title: 'Components/MarkdownText',
	component: MarkdownText,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MarkdownText>;

const sampleMarkdown = `
# Heading 1
## Heading 2

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

| Table | Header |
|__ |__|
| Cell 1 | Cell 2 |

\`\`\`tsx
const hello = "world";
console.log(hello);
\`\`\`
`;

export const Default: Story = {
	render: (args) => {
		const runtime = useLocalRuntime({run: () => Promise.resolve({content: args.content})},{
			initialMessages: [
				{
					id: 'welcome',
					role: 'assistant',
					content: [
						{
							type: 'text',
							text: args.content,
						},
					],
				},
			],
		});
		return (
			<AssistantRuntimeProvider runtime={runtime}>
				<ThreadPrimitive.Messages
					components={{
						Message: () => (
							<MessagePrimitive.Parts
								components={{ Text: MarkdownText }}
							/>
						),
					}}
				/>
			</AssistantRuntimeProvider>
		);
	},
	args: {
		content: 'Hello **World**',
	},
};

export const ComplexDocument: Story = {
  	render: (args) => {
		const runtime = useLocalRuntime({run: () => Promise.resolve({content: args.content})},{
			initialMessages: [
				{
					id: 'welcome',
					role: 'assistant',
					content: [
						{
							type: 'text',
							text: args.content,
						},
					],
				},
			],
		});
		return (
			<AssistantRuntimeProvider runtime={runtime}>
				<ThreadPrimitive.Messages
					components={{
						Message: () => (
							<MessagePrimitive.Parts
								components={{ Text: MarkdownText }}
							/>
						),
					}}
				/>
			</AssistantRuntimeProvider>
		);
	},
	args: {
		content: sampleMarkdown,
	},
};

export const PythonCode: Story = {
  	render: (args) => {
		const runtime = useLocalRuntime({run: () => Promise.resolve({content: args.content})},{
			initialMessages: [
				{
					id: 'welcome',
					role: 'assistant',
					content: [
						{
							type: 'text',
							text: args.content,
						},
					],
				},
			],
		});
		return (
			<AssistantRuntimeProvider runtime={runtime}>
				<ThreadPrimitive.Messages
					components={{
						Message: () => (
							<MessagePrimitive.Parts
								components={{ Text: MarkdownText }}
							/>
						),
					}}
				/>
			</AssistantRuntimeProvider>
		);
	},
	args: {
		content: `
\`\`\`python
def hello():
    print("Hello from Python")
\`\`\`
    `,
	},
};
