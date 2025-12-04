/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	MessagePrimitive,
	ThreadPrimitive,
} from '@assistant-ui/react';
import '@testing-library/jest-dom';
/**
 * Internal dependencies
 */
import MarkdownText from '../markdownText';
import { MockAssistantProvider } from '../test-utils/mockAssistantProvider';

Object.assign(navigator, {
	clipboard: {
		writeText: jest.fn(),
	},
});

// Mock SyntaxHighlighter to avoid loading heavy parsing in tests
jest.mock('../../syntaxhighlighter', () => ({
	SyntaxHighlighter: ({ children }: { children: React.ReactNode }) => (
		<pre data-testid="mock-highlighter">{children}</pre>
	),
}));

describe('MarkdownText', () => {
	it('renders basic markdown elements', async () => {
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
		const button = await screen.findByText('#Hello World');
		expect(button).toHaveTextContent('Hello World');
	});

	it('renders code blocks with copy button', async () => {
		const code = 'console.log("test")';
		const content = `\`\`\`js\n${code}\n\`\`\``;

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
		expect(await screen.findByText('js')).toBeInTheDocument();

		// Check for copy button
		const copyBtn = await screen.findByRole('button', { name: /copy/i });
		expect(copyBtn).toBeInTheDocument();
	});

	it('copies code to clipboard when clicked', async () => {
		const user = userEvent.setup();
		const code = 'print("hello")';
		const content = `\`\`\`python\n${code}\n\`\`\``;
		const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');
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

		const copyBtn = await screen.findByRole('button', { name: /copy/i });
		await user.click(copyBtn);

		expect(writeTextSpy).toHaveBeenCalledWith(
			expect.stringContaining(code)
		);
	});

	it('renders tables correctly', async () => {
		const content =
			'| Head 1 | Head 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';

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

		expect(await screen.findByRole('table')).toBeInTheDocument();
		expect(await screen.findAllByRole('row')).toHaveLength(2); // Header + 1 data row
	});
});
