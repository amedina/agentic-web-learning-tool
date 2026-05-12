/**
 * MCP's stdio transport reserves stdout for the JSON-RPC framing.
 * Anything else written there (a stray console.log from analyzer-core,
 * a debug print from a dependency, etc.) breaks the framing — clients
 * report each line as `Unexpected token X, "..." is not valid JSON`
 * and may abort the session.
 *
 * This module rebinds every console.* method to write to stderr
 * instead. It runs as a side-effect import from server.ts, before any
 * other module is loaded, so analyzer-core's own logging is captured
 * from the very first call. Behaviour for stderr / stdout users in
 * the chrome and vscode extensions is unchanged because they don't
 * import this file.
 */

const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

/**
 * Drops a value (any type console.log accepts) onto stderr in roughly
 * the same shape Node's default console formatter would have used. We
 * stringify objects via `util.inspect` so a `console.log({...})` in
 * analyzer-core renders the same way it would on a developer's
 * terminal — just on the right channel.
 */
function writeToStderr(values: unknown[]): void {
  const formatted = values
    .map((value) => {
      if (typeof value === "string") {
        return value;
      }
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })
    .join(" ");
  originalStderrWrite(`${formatted}\n`);
}

console.log = (...values: unknown[]): void => writeToStderr(values);
console.info = (...values: unknown[]): void => writeToStderr(values);
console.warn = (...values: unknown[]): void => writeToStderr(values);
console.debug = (...values: unknown[]): void => writeToStderr(values);
console.error = (...values: unknown[]): void => writeToStderr(values);

// Keep the original stdout write available for the MCP transport — any
// other code that calls process.stdout.write directly still hits the
// real stdout, but no third-party we currently depend on does that.
export { originalStdoutWrite };
