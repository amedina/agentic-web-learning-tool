/**
 * External dependencies.
 */
import { useRef, useState } from 'react';
import {
  coldarkDark,
  coldarkCold,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Internal dependencies.
 */
import { SyntaxHighlighterWrapper } from '../syntaxHighlighter';

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

  const activeStyle = isDarkMode ? coldarkDark : coldarkCold;
  const backgroundColor = isDarkMode ? '#282a36' : 'white';
  const caretColor = isDarkMode ? '#f8f8f2' : 'black';

  return (
    <div className="flex-1 relative flex">
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
          <SyntaxHighlighterWrapper
            style={activeStyle}
            language="javascript"
            background={backgroundColor}
            code={code}
            selectedLineNumbers={breakpoints}
            showLineNumbers={true}
            onLinenumberClick={toggleBreakpoint}
            preTag={(props: any) => (
              <pre
                {...props}
                style={{
                  margin: 0,
                  minHeight: '100%',
                  ...commonStyle,
                  backgroundColor: backgroundColor,
                }}
              />
            )}
            codeTag={(props: any) => (
              <code
                {...props}
                style={{ fontFamily: 'inherit', textShadow: 'none' }}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
