/**
 * External dependencies.
 */
import type { IncomingMessage } from "node:http";

/**
 * Returns true when the request is allowed through.
 *
 * Auth is a SHARED-SECRET bearer token check, not identity auth —
 * there's no users table, no database lookup, no public-key crypto.
 * The user sets `MCP_HTTP_TOKEN=<long-random-string>` in the
 * server's environment and pastes the same string into the client's
 * config as `Authorization: Bearer <long-random-string>`. We just
 * compare the two strings: if they match, the request must have
 * known the secret. Same model as GitHub PATs, Anthropic API keys,
 * Stripe API keys, etc.
 *
 * The compare uses `timingSafeEqualString` so a network-side
 * attacker can't time their way to discovering the token one
 * character at a time. The wire itself should be TLS in any
 * deployment that exposes the server beyond loopback, otherwise a
 * sniffer would just read the token off the request.
 *
 * If no token is configured every request passes — auth is opt-in
 * for hosted/remote deployments. The default 127.0.0.1 bind keeps
 * unauthenticated mode safe by making the port unreachable from
 * outside the machine.
 */
export function isAuthorized(
  request: IncomingMessage,
  expected?: string,
): boolean {
  if (!expected) {
    return true;
  }
  const header = request.headers.authorization;
  if (typeof header !== "string") {
    return false;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) {
    return false;
  }
  return timingSafeEqualString(match[1], expected);
}

/**
 * Length-aware constant-time string comparison. Avoids leaking the
 * configured token's length through early-return timing differences.
 */
function timingSafeEqualString(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
