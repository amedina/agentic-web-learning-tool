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

    // EDITOR CONFIG
    const editorFontFamily = '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace';
    const editorFontSize = '14px';
    const editorLineHeight = '1.5';
    const editorPadding = '1.5rem 1rem';

    // Cast to any to allow style prop which is missing in types but valid in runtime
    const SyntaxHighlighterAny = SyntaxHighlighter as any;

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (backdropRef.current) {
            backdropRef.current.scrollTop = e.currentTarget.scrollTop;
            backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    const commonStyle = {
        fontFamily: editorFontFamily,
        fontSize: editorFontSize,
        lineHeight: editorLineHeight,
        padding: editorPadding,
    };

    return (
        <div className="flex-1 relative">
            <textarea
                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-black z-10 resize-none outline-none border-none focus:ring-0 whitespace-nowrap overflow-auto"
                value={code}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                spellCheck={false}
                style={{
                    ...commonStyle,
                    whiteSpace: 'pre', // CRITICAL for alignment
                }}
            />
            <div
                ref={backdropRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-white"
            >
                {/* @ts-ignore */}
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
    );
}
