interface CodeEditorGutterProps {
  lineNumbers: number[];
  breakpoints: number[];
  toggleBreakpoint: (lineNum: number) => void;
  enableBreakpoints: boolean;
  commonStyle: React.CSSProperties;
  gutterBg: string;
  gutterText: string;
  breakpointColor: string;
  gutterRef: React.RefObject<HTMLDivElement | null>;
}

export const CodeEditorGutter = ({
  lineNumbers,
  breakpoints,
  toggleBreakpoint,
  enableBreakpoints,
  commonStyle,
  gutterBg,
  gutterText,
  breakpointColor,
  gutterRef,
}: CodeEditorGutterProps) => {
  return (
    <div
      ref={gutterRef}
      className="select-none text-right overflow-hidden border-r border-[#e0e0e0] flex-shrink-0 relative z-20 cursor-default"
      style={{
        width: '2.9rem',
        backgroundColor: gutterBg,
        color: gutterText,
      }}
    >
      <div
        // @ts-ignore - ts(2322)
        style={{
          ...commonStyle,
          padding: '1.5rem 0',
          whiteSpace: 'pre',
        }}
      >
        {lineNumbers.map((num) => {
          const hasBreakpoint = breakpoints.includes(num);
          return (
            <div
              key={num}
              onClick={() =>
                !enableBreakpoints ? null : toggleBreakpoint(num)
              }
              className={`relative hover:text-gray-800 ${
                enableBreakpoints ? 'cursor-pointer' : ''
              }`}
              style={{
                paddingRight: '0.5rem',
                color: hasBreakpoint ? 'white' : 'inherit',
              }}
            >
              {hasBreakpoint && (
                <div
                  className="absolute left-0 top-0 w-full h-full"
                  style={{
                    backgroundColor: breakpointColor,
                    clipPath:
                      'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)',
                  }}
                />
              )}
              <span className="relative z-10">{num}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
