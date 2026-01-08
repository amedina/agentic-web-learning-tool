/**
 * External dependencies.
 */
import { useRef } from 'react';

/**
 * Internal dependencies.
 */
import SyntaxHighlighter from './syntaxHighlighter';
import { vs, dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeEditorProps {
	code: string;
	onChange: (code: string) => void;
	isDarkMode?: boolean;
}

export function CodeEditor({
	code,
	onChange,
	isDarkMode = false,
}: CodeEditorProps) {
	const backdropRef = useRef<HTMLDivElement>(null);
	const gutterRef = useRef<HTMLDivElement>(null);

	const editorFontFamily =
		'"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace';
	const editorFontSize = '14px';
	const editorLineHeight = '1.5';
	const editorPadding = '1.5rem 1rem';

	const SyntaxHighlighterAny = SyntaxHighlighter as any;

	const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
		if (backdropRef.current) {
			backdropRef.current.scrollTop = e.currentTarget.scrollTop;
			backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
		}
		if (gutterRef.current) {
			gutterRef.current.scrollTop = e.currentTarget.scrollTop;
		}
	};

	const commonStyle = {
		fontFamily: editorFontFamily,
		fontSize: editorFontSize,
		lineHeight: editorLineHeight,
		padding: editorPadding,
	};

	const lines = code.split('\n');
	const lineNumbers = lines.map((_, index) => index + 1);

	const activeStyle = isDarkMode ? dracula : vs;
	const backgroundColor = isDarkMode ? '#282a36' : 'white'; // Dracula bg
	const caretColor = isDarkMode ? '#f8f8f2' : 'black'; // Dracula fg
	const gutterBg = isDarkMode ? '#21222c' : '#f3f4f6'; // Dracula gutter
	const gutterText = isDarkMode ? '#6272a4' : '#9ca3af'; // Dracula comment/selection

	return (
		<div className="flex-1 relative flex">
			{/* Line Numbers Gutter */}
			<div
				ref={gutterRef}
				className="select-none text-right overflow-hidden border-r border-gray-100 flex-shrink-0"
				style={{
					...commonStyle,
					padding: '1.5rem 0.5rem',
					width: '3rem',
					whiteSpace: 'pre',
					backgroundColor: gutterBg,
					color: gutterText,
				}}
			>
				{lineNumbers.map((num) => (
					<div key={num}>{num}</div>
				))}
			</div>

			{/* Editor Area */}
			<div className="relative flex-1">
				<textarea
					className="absolute inset-0 w-full h-full bg-transparent text-transparent resize-none outline-none border-none focus:ring-0 whitespace-nowrap overflow-auto max-w-full"
					value={code}
					onChange={(e) => onChange(e.target.value)}
					onScroll={handleScroll}
					spellCheck={false}
					style={{
						...commonStyle,
						whiteSpace: 'pre',
						caretColor: caretColor,
						zIndex: 10,
					}}
				/>
				<div
					ref={backdropRef}
					className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
					style={{ backgroundColor: backgroundColor }}
				>
					<SyntaxHighlighterAny
						language="javascript"
						code={code}
						style={activeStyle}
						components={{
							Pre: (props: any) => (
								<pre
									{...props}
									style={{
										margin: 0,
										minHeight: '100%',
										...commonStyle,
										backgroundColor: backgroundColor,
									}}
								/>
							),
							Code: (props: any) => (
								<code
									{...props}
									style={{ fontFamily: 'inherit' }}
								/>
							),
						}}
					/>
				</div>
			</div>
		</div>
	);
}
