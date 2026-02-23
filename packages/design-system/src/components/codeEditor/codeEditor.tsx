/**
 * External dependencies.
 */
import { useRef, useState } from 'react';
import { vs, dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Internal dependencies.
 */
import { SyntaxHighlighterWhite } from '../syntaxHighlighter';
import { CodeEditorGutter } from './codeEditorGutter';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  isDarkMode?: boolean;
  styles?: React.CSSProperties;
  enableBreakpoints?: boolean;
}

export function CodeEditor({
  code,
  onChange,
  isDarkMode = false,
  styles = {},
  enableBreakpoints = false,
}: CodeEditorProps & { enableBreakpoints?: boolean }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);

  const SyntaxHighlighterAny = SyntaxHighlighterWhite as any;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const toggleBreakpoint = (lineNum: number) => {
    if (!enableBreakpoints) return;
    setBreakpoints((prev) =>
      prev.includes(lineNum)
        ? prev.filter((n) => n !== lineNum)
        : [...prev, lineNum]
    );
  };

  const commonStyle = {
    fontFamily:
      '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    padding: '1.5rem 1rem',
    ...styles,
  };

  const lines = code.split('\n');
  const lineNumbers = lines.map((_, index) => index + 1);

  const activeStyle = isDarkMode ? dracula : vs;
  const backgroundColor = isDarkMode ? '#282a36' : 'white';
  const caretColor = isDarkMode ? '#f8f8f2' : 'black';
  const gutterBg = isDarkMode ? '#21222c' : 'white';
  const gutterText = isDarkMode ? '#6272a4' : '#6e6e6e';
  const breakpointColor = '#1a73e8';

  return (
    <div className="flex-1 relative flex">
      <CodeEditorGutter
        gutterRef={gutterRef}
        lineNumbers={lineNumbers}
        breakpoints={breakpoints}
        toggleBreakpoint={toggleBreakpoint}
        enableBreakpoints={enableBreakpoints}
        commonStyle={commonStyle}
        gutterBg={gutterBg}
        gutterText={gutterText}
        breakpointColor={breakpointColor}
      />

      {/* Editor Area */}
      <div className="relative flex-1">
        <textarea
          className="absolute inset-0 w-full h-full bg-transparent text-transparent resize-none outline-none border-none focus:ring-0 whitespace-nowrap overflow-auto max-w-full"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          // @ts-ignore - ts(2322)
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
                  style={{ fontFamily: 'inherit', textShadow: 'none' }}
                />
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
