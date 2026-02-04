/**
 * Internal dependencies.
 */
import SyntaxHighlighterWhite from './syntaxHighlighterWhite';

export interface SyntaxHighlighterJSONProps {
  json: any;
}

const SyntaxHighlighterJSON = ({ json }: SyntaxHighlighterJSONProps) => {
  return (
    <SyntaxHighlighterWhite
      language="json"
      code={JSON.stringify(json, null, 2)}
      components={{
        Pre: (props: any) => (
          <pre
            {...props}
            style={{
              margin: 0,
              minHeight: '100%',
            }}
          />
        ),
        Code: (props: any) => (
          <code {...props} style={{ fontFamily: 'inherit' }} />
        ),
      }}
    />
  );
};

export default SyntaxHighlighterJSON;
