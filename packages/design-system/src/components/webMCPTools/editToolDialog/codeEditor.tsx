/**
 * External dependencies.
 */
import { useRef, useState } from 'react';
import { vs, dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Internal dependencies.
 */
import { SyntaxHighlighterWhite } from '../../syntaxHighlighter';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  isDarkMode?: boolean;
  styles?: React.CSSProperties;
}

export function CodeEditor({
  code,
  onChange,
  isDarkMode = false,
  styles = {},
  enableBreakpoints = false,
}: CodeEditorProps & { enableBreakpoints?: boolean }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
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
    fontSize: '12px',
    lineHeight: '1.5',
    padding: '0',
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
    <div className="flex-1 relative flex text-[12px]">
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        className="select-none text-right overflow-hidden border-r border-[#e0e0e0] flex-shrink-0 relative z-20 cursor-default"
        style={{
          ...commonStyle,
          width: '2.9rem', // Reduced width as requested (approx 10px less than 3.5rem)
          backgroundColor: gutterBg,
          color: gutterText,
          paddingTop: '1.5rem',
        }}
      >
        {lineNumbers.map((num) => {
          const hasBreakpoint = breakpoints.includes(num);
          return (
            <div
              key={num}
              onClick={() => toggleBreakpoint(num)}
              className={`relative hover:text-gray-800 ${
                enableBreakpoints ? 'cursor-pointer' : ''
              }`}
              style={{
                height: '18px',
                lineHeight: '18px',
                paddingRight: '0.5rem',
                color: hasBreakpoint ? 'white' : 'inherit',
              }}
            >
              {hasBreakpoint && enableBreakpoints && (
                <div
                  className="absolute left-0 top-0 w-full h-full"
                  style={{
                    backgroundColor: breakpointColor,
                    clipPath:
                      'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)',
                  }}
                />
              )}
              <span className="relative z-10 font-mono">{num}</span>
            </div>
          );
        })}
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
            padding: '1.5rem 0 1.5rem 0.5rem',
            lineHeight: '18px',
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
            customStyle={{
              margin: 0,
              padding: '1.5rem 0 1.5rem 0.5rem',
              fontSize: commonStyle.fontSize,
              lineHeight: '18px',
              minHeight: '100%',
              backgroundColor: backgroundColor,
              fontFamily: commonStyle.fontFamily,
            }}
            codeTagProps={{
              style: {
                fontSize: commonStyle.fontSize,
                fontFamily: commonStyle.fontFamily,
              },
            }}
            components={{
              Pre: (props: any) => (
                <pre
                  {...props}
                  style={{
                    ...props.style,
                    fontFamily: commonStyle.fontFamily,
                    fontSize: commonStyle.fontSize,
                  }}
                />
              ),
              Code: (props: any) => (
                <code
                  {...props}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: commonStyle.fontSize,
                  }}
                />
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
