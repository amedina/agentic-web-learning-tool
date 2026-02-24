/**
 * External dependencies
 */
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';

SyntaxHighlighter.registerLanguage('js', tsx);

type SyntaxHighlighterWrapperProps = {
  showLineNumbers?: boolean;
  style: any;
  code: string;
  language: string;
  background: string;
  onLinenumberClick?: (lineNumber: number) => void;
  codeTag?: React.ComponentType<any>;
  preTag?: React.ComponentType<any>;
  selectedLineNumbers?: number[];
  isDarkMode?: boolean;
};

const SyntaxHighlighterWrapper = ({
  showLineNumbers = false,
  style,
  code,
  language,
  background,
  onLinenumberClick,
  codeTag,
  preTag,
  selectedLineNumbers = [],
  isDarkMode = false,
}: SyntaxHighlighterWrapperProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={style}
      showLineNumbers={showLineNumbers}
      showInlineLineNumbers={showLineNumbers}
      wrapLines={true}
      CodeTag={codeTag}
      PreTag={preTag}
      lineNumberStyle={(lineNumber: number) => {
        const gutterBg = !isDarkMode ? '#21222c' : 'white';
        const gutterText = !isDarkMode ? '#6272a4' : '#6e6e6e';
        return {
          cursor: 'pointer',
          backgroundColor: selectedLineNumbers.includes(lineNumber)
            ? gutterBg
            : 'inherit',
          color: selectedLineNumbers.includes(lineNumber)
            ? gutterText
            : 'inherit',
        };
      }}
      customStyle={{
        margin: 0,
        width: '100%',
        background,
        padding: '1.5rem 1rem',
        fontFamily:
          '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
      lineProps={(lineNumber: number) => {
        return {
          style: { cursor: 'pointer' },
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
