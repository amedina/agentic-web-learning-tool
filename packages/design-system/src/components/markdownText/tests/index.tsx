import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	AssistantRuntimeProvider,
	MessagePrimitive,
	ThreadPrimitive,
	useLocalRuntime,
} from '@assistant-ui/react';
import '@testing-library/jest-dom';

import { MarkdownText } from '../markdownText';
import { MockAssistantProvider } from './mockAssistantProvider';

Object.assign(navigator, {
	clipboard: {
		writeText: jest.fn(),
	},
});

// Mock SyntaxHighlighter to avoid loading heavy parsing in tests
jest.mock('../../shikiHighlighter', () => ({
	SyntaxHighlighter: ({ children }: { children: React.ReactNode }) => (
		<pre data-testid="mock-highlighter">{children}</pre>
	),
}));

describe('MarkdownText', () => {
	it('renders basic markdown elements', () => {
		const content = '#Hello World\n\nThis is a **bold** statement.';

		render(
			<MockAssistantProvider welcomeMessage={content}>
				<ThreadPrimitive.Messages
					components={{
						Message: () => (
							<MessagePrimitive.Parts
								components={{ Text: MarkdownText }}
							/>
						),
					}}
				/>
			</MockAssistantProvider>
		);

		expect(screen.getByRole('body')).toHaveTextContent(
			'Hello World'
		);
	});

	it('renders code blocks with copy button', async () => {
		const code = 'console.log("test")';
		const content = `\`\`\`js\n${code}\n\`\`\``;

		render(
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

		// Check for language label (from CodeHeader)
		expect(screen.getByText('js')).toBeInTheDocument();

		// Check for copy button
		const copyBtn = screen.getByRole('button', { name: /copy/i }); // tooltip text is "Copy"
		expect(copyBtn).toBeInTheDocument();
	});

	it('copies code to clipboard when clicked', async () => {
		const user = userEvent.setup();
		const code = 'print("hello")';
		const content = `\`\`\`python\n${code}\n\`\`\``;

				const runtime = renderHook(() =>
			useLocalRuntime(
				{
					run: () =>
						Promise.resolve({
							content: [{ type: 'text', text: content }],
						}),
				},
				{
					initialMessages: [
						{
							id: 'welcome',
							role: 'assistant',
							content: [
								{
									type: 'text',
									text: content,
								},
							],
						},
					],
				}
			)
		).result.current;

		render(
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

		const copyBtn = screen.getByRole('button', { name: /copy/i });
		await user.click(copyBtn);

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			expect.stringContaining(code)
		);

		// Expect icon change (CheckIcon) if possible, though usually tested via visual regression or state check
		await waitFor(() => {
			// The tooltip text or icon might change, but we mocked the visual components mostly.
			// Just verifying the clipboard function is usually sufficient for logic tests.
		});
	});

	it('renders tables correctly', () => {
		const content =
			'| Head 1 | Head 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
				const runtime = renderHook(() =>
			useLocalRuntime(
				{
					run: () =>
						Promise.resolve({
							content: [{ type: 'text', text: content }],
						}),
				},
				{
					initialMessages: [
						{
							id: 'welcome',
							role: 'assistant',
							content: [
								{
									type: 'text',
									text: content,
								},
							],
						},
					],
				}
			)
		).result.current;

		render(
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

		expect(screen.getByRole('table')).toBeInTheDocument();
		expect(screen.getAllByRole('row')).toHaveLength(2); // Header + 1 data row
	});
});
