/**
 * Internal dependencies.
 */
import { generateNonce } from "./mcpSetupHelpers";

/**
 * Builds the wizard's HTML shell — strict CSP, nonce, bundled script.
 * Takes the webview-resolved script/style URIs and the webview's CSP
 * source so the panel can keep all `vscode.Webview` plumbing on its side
 * while this module owns the static markup.
 *
 * @param scriptUri Webview-safe URI of the bundled wizard script.
 * @param styleUri Webview-safe URI of the bundled wizard stylesheet.
 * @param cspSource The webview's `cspSource` string for CSP allow-lists.
 * @returns The full HTML document for the wizard webview.
 */
export function renderWizardHtml(
  scriptUri: string,
  styleUri: string,
  cspSource: string,
): string {
  const nonce = generateNonce();
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${cspSource};"
    />
    <link rel="stylesheet" href="${styleUri}" />
    <title>NPM Advisor: MCP Setup</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}
