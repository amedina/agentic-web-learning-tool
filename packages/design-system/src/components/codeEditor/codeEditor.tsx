/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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
}: CodeEditorProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [_code, setCode] = useState('');

  // 1. Parsing Effect: Separates 'debugger;' statements from the code logic
  useEffect(() => {
    const rawLines = code.split('\n');
    const cleanLines: string[] = [];
    const detectedBreakpoints: number[] = [];

    rawLines.forEach((line) => {
      if (line.trim() === 'debugger;') {
        detectedBreakpoints.push(cleanLines.length);
      } else {
        cleanLines.push(line);
      }
    });

    const newCleanCode = cleanLines.join('\n');

    setCode((prev) => {
      if (newCleanCode !== prev) {
        return newCleanCode;
      }
      return prev;
    });

    setBreakpoints(detectedBreakpoints);
  }, [code]);

  useEffect(() => {
    return () => {
      setBreakpoints([]);
      setCode('');
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // 2. Toggle Logic: Updates the list and RECONSTRUCTS the file
  const toggleBreakpoint = useCallback(
    (lineIndex: number) => {
      if (!enableBreakpoints) {
        return;
      }

      // Calculate new breakpoint list
      const isRemoving = breakpoints.includes(lineIndex);
      const newBreakpoints = isRemoving
        ? breakpoints.filter((b) => b !== lineIndex)
        : [...breakpoints, lineIndex].sort((a, b) => a - b);
      setBreakpoints(newBreakpoints);
      const cleanLines = _code.split('\n');
      const finalLines: string[] = [];

      cleanLines.forEach((line, index) => {
        if (newBreakpoints.includes(index)) {
          finalLines.push('debugger;');
        }
        finalLines.push(line);
      });
      onChange(finalLines.join('\n'));
    },
    [breakpoints, _code, onChange, enableBreakpoints]
  );

  // 3. Editor Changes: Handle typing in the editor
  const handleEditorChange = useCallback(
    (newVisualCode: string) => {
      setCode(newVisualCode);
      const cleanLines = newVisualCode.split('\n');
      const finalLines: string[] = [];

      cleanLines.forEach((line, index) => {
        if (breakpoints.includes(index)) {
          finalLines.push('debugger;');
        }
        finalLines.push(line);
      });

      onChange(finalLines.join('\n'));
    },
    [breakpoints, onChange]
  );

  const commonStyle = {
    fontFamily:
      '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    ...styles,
  };

  const activeStyle = isDarkMode ? coldarkDark : coldarkCold;
  const backgroundColor = isDarkMode ? '#282a36' : 'white';
  const caretColor = isDarkMode ? '#f8f8f2' : 'black';

  return (
    <div className="flex-1 relative flex">
      {/* Editor Area */}
      <div className="relative flex-1 overflow-hidden h-full">
        <textarea
          className="absolute inset-0 w-full h-full bg-transparent text-transparent resize-none outline-none border-none focus:ring-0 whitespace-nowrap overflow-auto max-w-full"
          value={_code}
          onChange={(e) => handleEditorChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          // @ts-ignore - ts(2322)
          style={{
            ...commonStyle,
            margin: '1rem 1rem',
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
            code={_code}
            background={backgroundColor}
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
