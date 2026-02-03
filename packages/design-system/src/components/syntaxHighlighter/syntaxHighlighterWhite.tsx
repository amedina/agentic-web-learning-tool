/**
 * External dependencies
 */
import { makePrismAsyncLightSyntaxHighlighter } from '@assistant-ui/react-syntax-highlighter';
import { PrismAsyncLight } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

PrismAsyncLight.registerLanguage('js', tsx);

const SyntaxHighlighterWhite = makePrismAsyncLightSyntaxHighlighter({
  style: vs,
  customStyle: {
    margin: 0,
    width: '100%',
    background: 'white',
    padding: '1.5rem 1rem',
    fontFamily:
      '"Fira Code", "Cascadia Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
  },
});

export default SyntaxHighlighterWhite;
