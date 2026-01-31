/**
 * External dependencies.
 */
import { forwardRef } from 'react';

interface CodeEditorGutterProps {
  lineNumbers: number[];
  breakpoints: number[];
  toggleBreakpoint: (lineNum: number) => void;
  enableBreakpoints: boolean;
  commonStyle: React.CSSProperties;
  gutterBg: string;
  gutterText: string;
  breakpointColor: string;
}

export const CodeEditorGutter = forwardRef<
  HTMLDivElement,
  CodeEditorGutterProps
>(
  (
    {
      lineNumbers,
      breakpoints,
      toggleBreakpoint,
      enableBreakpoints,
      commonStyle,
      gutterBg,
      gutterText,
      breakpointColor,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="select-none text-right overflow-hidden border-r border-[#e0e0e0] flex-shrink-0 relative z-20 cursor-default"
        style={{
          ...commonStyle,
          width: '2.9rem',
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
    );
  }
);

CodeEditorGutter.displayName = 'CodeEditorGutter';
