/**
 * External dependencies
 */
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('js', tsx);

type SyntaxHighlighterWrapperProps = {
  showLineNumbers?: boolean;
  code: string;
  language: string;
  background: string;
  onLinenumberClick?: (lineNumber: number) => void;
  codeTag?: React.ComponentType<any>;
  preTag?: React.ComponentType<any>;
  selectedLineNumbers?: number[];
};

const SyntaxHighlighterWrapper = ({
  showLineNumbers = false,
  code,
  language,
  background,
  onLinenumberClick,
  codeTag,
  preTag,
  selectedLineNumbers = [],
}: SyntaxHighlighterWrapperProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={googlecode}
      showLineNumbers={showLineNumbers}
      showInlineLineNumbers={showLineNumbers}
      wrapLines={true}
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
          cssProperties.borderStyle = 'solid';
          cssProperties.borderWidth = '1px 4px 1px 1px';
        }

        return cssProperties;
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
