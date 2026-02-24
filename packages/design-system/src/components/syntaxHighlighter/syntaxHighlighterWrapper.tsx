/**
 * External dependencies
 */
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
/**
 * Internal dependencies
 */
import { darkTheme, lightTheme } from './googlecode';

type SyntaxHighlighterWrapperProps = {
  showLineNumbers?: boolean;
  code: string;
  language: string;
  onLinenumberClick?: (lineNumber: number) => void;
  codeTag?: React.ComponentType<any>;
  preTag?: React.ComponentType<any>;
  selectedLineNumbers?: number[];
};

const SyntaxHighlighterWrapper = ({
  showLineNumbers = false,
  code,
  language,
  onLinenumberClick,
  codeTag,
  preTag,
  selectedLineNumbers = [],
}: SyntaxHighlighterWrapperProps) => {
  const style: { [key: string]: React.CSSProperties } =
    document.documentElement.classList.contains('dark')
      ? darkTheme
      : lightTheme;

  return (
    <SyntaxHighlighter
      language={language}
      style={style}
      showLineNumbers={showLineNumbers}
      showInlineLineNumbers={showLineNumbers}
      wrapLines={true}
      useInlineStyles={false}
      CodeTag={codeTag}
      PreTag={preTag}
      lineNumberStyle={(lineNumber: number) => {
        const cssProperties: React.CSSProperties = {
          cursor: 'pointer',
          borderStyle: 'solid',
          borderWidth: '1px 4px 1px 1px',
          borderColor: 'transparent',
        };

        if (selectedLineNumbers.includes(lineNumber)) {
          cssProperties.WebkitBorderImage = `url("data:image/svg+xml,<svg height='11' width='26' xmlns='http://www.w3.org/2000/svg'><path d='M22.8.5l2.7 5-2.7 5H.5V.5z' fill='%235186EC' stroke='%231a73e8'/></svg>") 1 3 1 1 fill`;
        }

        return cssProperties;
      }}
      customStyle={{
        margin: 0,
        width: '100%',
        background: 'var(--background)',
        fontFamily:
          '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
      lineProps={(lineNumber: number) => {
        return {
          style: { cursor: 'pointer', color: 'var(--foreground)' },
          onClick() {
            onLinenumberClick?.(lineNumber);
          },
        };
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default SyntaxHighlighterWrapper;
