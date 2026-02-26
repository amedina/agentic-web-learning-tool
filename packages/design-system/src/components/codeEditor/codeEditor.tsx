/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Internal dependencies.
 */
import { SyntaxHighlighterWrapper } from '../syntaxHighlighter';
import { toast } from '../toast';
import { insertDebugger } from '../../lib/isValidDebuggerPosition';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  styles?: React.CSSProperties;
  enableBreakpoints?: boolean;
  textareaLineHeight?: string;
  editorLineHeight?: string;
}

export function CodeEditor({
  code,
  onChange,
  styles = {},
  enableBreakpoints = false,
  textareaLineHeight = '1.5',
  editorLineHeight = '1.5',
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
      if (line.trim() === 'debugger;' || line.trim() === 'debugger') {
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

      const cleanLines = _code.split('\n');
      const finalLines: string[] = [];

      cleanLines.forEach((line, index) => {
        if (newBreakpoints.includes(index)) {
          finalLines.push('debugger;');
        }
        finalLines.push(line);
      });

      const result = insertDebugger(cleanLines.join('\n'), {
        line: lineIndex,
      });

      if (isRemoving) {
        setBreakpoints(newBreakpoints);
        onChange(finalLines.join('\n'));
        return;
      }

      if (result.success) {
        setBreakpoints(newBreakpoints);
        onChange(finalLines.join('\n'));
      } else {
        toast.error(result.reason);
      }
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
  const { marginLeft = '', ...restStyles } = styles;
  const commonStyle = {
    fontFamily:
      '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '14px',
    ...restStyles,
  };

  const backgroundColor = 'var(--background)';
  const caretColor = 'var(--foreground)';
  return (
    <div className="flex-1 relative flex h-full mt-2 ml-2">
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
            whiteSpace: 'pre',
            lineHeight: textareaLineHeight,
            caretColor: caretColor,
            zIndex: 10,
            marginLeft,
          }}
        />
        <div
          ref={backdropRef}
          className="absolute inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden"
          style={{ backgroundColor: backgroundColor }}
        >
          <SyntaxHighlighterWrapper
            language="javascript"
            code={_code}
            selectedLineNumbers={breakpoints}
            showLineNumbers={true}
            onLinenumberClick={toggleBreakpoint}
            width={
              textareaLineHeight === '1.369' ? 'calc(2.25rem - 1em)' : '2.25rem'
            }
            preTag={(props: any) => (
              <pre
                {...props}
                style={{
                  margin: 0,
                  minHeight: '100%',
                  lineHeight: editorLineHeight,
                  ...restStyles,
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
