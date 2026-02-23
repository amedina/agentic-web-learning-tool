/**
 * External dependencies.
 */
import {
  coldarkDark,
  coldarkCold,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
/**
 * Internal dependencies.
 */
import SyntaxHighlighterWrapper from './syntaxHighlighterWrapper';

export interface SyntaxHighlighterJSONProps {
  json: any;
}

const SyntaxHighlighterJSON = ({ json }: SyntaxHighlighterJSONProps) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const activeStyle = isDarkMode ? coldarkDark : coldarkCold;
  const backgroundColor = isDarkMode ? '#282a36' : 'white';

  return (
    <SyntaxHighlighterWrapper
      language="json"
      style={activeStyle}
      showLineNumbers={false}
      background={backgroundColor}
      code={JSON.stringify(json, null, 2)}
      isDarkMode={isDarkMode}
      preTag={(props: any) => (
        <pre
          {...props}
          style={{
            margin: 0,
            minHeight: '100%',
            fontSize: '11px',
            lineHeight: '1.4',
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
  );
};

export default SyntaxHighlighterJSON;
