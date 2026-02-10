/**
 * External dependencies.
 */
import { useEffect, useRef, useState } from 'react';
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
}: CodeEditorProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);

  // _code represents the "Visual" code (without debugger statements)
  const [_code, setCode] = useState('');

  const SyntaxHighlighterAny = SyntaxHighlighterWhite as any;

  // 1. Parsing Effect: Separates 'debugger;' statements from the code logic
  useEffect(() => {
    // Split the raw file content
    const rawLines = code.split('\n');
    const cleanLines: string[] = [];
    const detectedBreakpoints: number[] = [];

    rawLines.forEach((line) => {
      if (line.trim() === 'debugger;') {
        // If we hit a debugger, mark the CURRENT line index of the CLEAN code
        // as a breakpoint. This effectively attaches the debugger to the *next* // line of code that will be pushed.
        detectedBreakpoints.push(cleanLines.length);
      } else {
        cleanLines.push(line);
      }
    });

    // Only update state if there is a mismatch to prevent infinite loops
    // when onChange triggers this effect again.
    const newCleanCode = cleanLines.join('\n');

    // We update the internal visual state only if the parsing results in different content
    // This check is crucial because onChange updates 'code', which fires this effect.
    // We want to ensure the visual cursor doesn't jump unnecessarily.
    setCode((prev) => {
      if (newCleanCode !== prev) {
        return newCleanCode;
      }
      return prev;
    });

    // We always synchronize breakpoints from the source
    // (A deep comparison could be added here for optimization, but setting array is fine)
    setBreakpoints(detectedBreakpoints);
  }, [code]);

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
  const toggleBreakpoint = (lineIndex: number) => {
    if (!enableBreakpoints) return;

    // Calculate new breakpoint list
    const isRemoving = breakpoints.includes(lineIndex);
    const newBreakpoints = isRemoving
      ? breakpoints.filter((b) => b !== lineIndex)
      : [...breakpoints, lineIndex].sort((a, b) => a - b);

    // Update Local State for immediate UI feedback
    setBreakpoints(newBreakpoints);

    // Reconstruct the file content:
    // We take the current "Clean" code and inject 'debugger;' statements
    // based on the new breakpoint list.
    const cleanLines = _code.split('\n');
    const finalLines: string[] = [];

    cleanLines.forEach((line, index) => {
      // If this index has a breakpoint, insert debugger BEFORE the line
      if (newBreakpoints.includes(index)) {
        finalLines.push('debugger;');
      }
      finalLines.push(line);
    });

    // Notify parent with the valid JS code (containing debuggers)
    onChange(finalLines.join('\n'));
  };

  // 3. Editor Changes: Handle typing in the editor
  const handleEditorChange = (newVisualCode: string) => {
    // Update local visual state immediately
    setCode(newVisualCode);

    // When the user types, we need to reconstruct the file with EXISTING breakpoints.
    const cleanLines = newVisualCode.split('\n');
    const finalLines: string[] = [];

    cleanLines.forEach((line, index) => {
      if (breakpoints.includes(index)) {
        finalLines.push('debugger;');
      }
      finalLines.push(line);
    });

    onChange(finalLines.join('\n'));
  };

  const commonStyle = {
    fontFamily:
      '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    padding: '1.5rem 1rem',
    ...styles,
  };

  const lines = _code.split('\n');
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
          value={_code}
          onChange={(e) => handleEditorChange(e.target.value)}
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
            code={_code}
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
                <code {...props} style={{ fontFamily: 'inherit' }} />
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
