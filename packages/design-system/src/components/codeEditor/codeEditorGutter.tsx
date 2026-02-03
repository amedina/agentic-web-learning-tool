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
      className="select-none text-right overflow-hidden border-r border-gray-100 flex-shrink-0"
      style={{
        ...commonStyle,
        padding: '1.5rem 0.5rem',
        width: '3rem',
        whiteSpace: 'pre',
        backgroundColor: gutterBg,
        color: gutterText,
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
              paddingRight: '0.5rem',
              color: hasBreakpoint ? 'white' : 'inherit',
            }}
          >
            {hasBreakpoint && enableBreakpoints && (
              <div
                className="absolute left-0 top-0 w-full h-full"
                style={{
                  backgroundColor: breakpointColor,
                  borderRadius: '50%',
                  transform: 'scale(0.4)',
                }}
              />
            )}
            <span className="relative z-10">{num}</span>
          </div>
        );
      })}
    </div>
  );
};
