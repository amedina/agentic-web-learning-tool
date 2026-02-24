/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Internal dependencies.
 */
import { SyntaxHighlighterWrapper } from '../syntaxHighlighter';
import { validateCode } from '../webMCPTools/editToolDialog/validateCode';
import { toast } from '../toast';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  styles?: React.CSSProperties;
  enableBreakpoints?: boolean;
}

export function CodeEditor({
  code,
  onChange,
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

      const result = validateCode(finalLines.join('\n'));
      if (result.valid && !result?.error) {
        setBreakpoints(newBreakpoints);
        onChange(finalLines.join('\n'));
      } else {
        toast.error(result?.error);
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

      const result = validateCode(cleanLines.join('\n'));

      if (result.valid && !result?.error) {
        onChange(finalLines.join('\n'));
      } else {
        toast.error(result?.error);
      }
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

  const backgroundColor = 'var(--background)';
  const caretColor = 'var(--foreground)';
  return (
    <div className="flex-1 relative flex h-full">
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
            marginLeft: '2.25rem',
            whiteSpace: 'pre',
            caretColor: caretColor,
            zIndex: 10,
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
