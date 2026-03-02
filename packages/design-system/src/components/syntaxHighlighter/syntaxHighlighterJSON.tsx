/**
 * Internal dependencies.
 */
import SyntaxHighlighterWrapper from './syntaxHighlighterWrapper';

export interface SyntaxHighlighterJSONProps {
  json: any;
}

const SyntaxHighlighterJSON = ({ json }: SyntaxHighlighterJSONProps) => {
  return (
    <SyntaxHighlighterWrapper
      language="json"
      showLineNumbers={false}
      code={JSON.stringify(json, null, 2)}
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
