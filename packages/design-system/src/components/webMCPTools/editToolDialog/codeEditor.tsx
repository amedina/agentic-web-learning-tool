/**
 * External dependencies.
 */
import { useRef } from 'react';

/**
 * Internal dependencies.
 */
import SyntaxHighlighter from './syntaxHighlighter';

interface CodeEditorProps {
    code: string;
    onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
    const backdropRef = useRef<HTMLDivElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);

    const editorFontFamily = '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace';
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

    return (
        <div className="flex-1 relative flex">
            {/* Line Numbers Gutter */}
            <div
                ref={gutterRef}
                className="select-none text-right bg-white text-gray-300 overflow-hidden border-r border-gray-100 flex-shrink-0"
                style={{
                    ...commonStyle,
                    padding: '1.5rem 0.5rem',
                    width: '3rem',
                    whiteSpace: 'pre',
                }}
            >
                {lineNumbers.map(num => (
                    <div key={num}>{num}</div>
                ))}
            </div>

            {/* Editor Area */}
            <div className="relative flex-1">
                <textarea
                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-black z-10 resize-none outline-none border-none focus:ring-0 whitespace-nowrap overflow-auto max-w-full"
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck={false}
                    style={{
                        ...commonStyle,
                        whiteSpace: 'pre',
                    }}
                />
                <div
                    ref={backdropRef}
                    className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-white"
                >
                    <SyntaxHighlighterAny
                        language="javascript"
                        code={code}
                        components={{
                            Pre: (props: any) => <pre {...props} style={{ margin: 0, minHeight: '100%', ...commonStyle, backgroundColor: 'white' }} />,
                            Code: (props: any) => <code {...props} style={{ fontFamily: 'inherit' }} />,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
