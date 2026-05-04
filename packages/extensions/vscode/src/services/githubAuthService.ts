/**
 * External dependencies.
 */
import * as vscode from "vscode";

const PROVIDER_ID = "github";
// Empty scopes list = a basic GitHub session sufficient to lift the
// 60-req/hr unauthenticated REST limit to 5 000/hr. We don't need
// `repo`, `read:user`, etc. — analyzer-core only reads public APIs.
const SCOPES: readonly string[] = [];

/**
 * Wraps vscode.authentication.getSession so analyzer-core can pull a
 * GitHub token without knowing about VSCode. The service caches the
 * session reference, listens for external sign-in / sign-out events
 * (e.g. from the Accounts gear menu), and exposes a typed
 * onDidChange so the rest of the extension can react to auth state
 * changes — primarily by clearing the stats cache so previously
 * rate-limited requests get retried with the new credentials.
 */
export class GithubAuthService implements vscode.Disposable {
  private session: vscode.AuthenticationSession | null = null;
  private readonly emitter = new vscode.EventEmitter<void>();
  private readonly subscription: vscode.Disposable;

  readonly onDidChange = this.emitter.event;

  /**
   * Subscribes to the GitHub provider's session-change events so
   * sign-ins / sign-outs originating outside this extension still
   * invalidate our cached session.
   */
  constructor() {
    this.subscription = vscode.authentication.onDidChangeSessions((event) => {
      if (event.provider.id !== PROVIDER_ID) {
        return;
      }
      this.session = null;
      this.emitter.fire();
    });
  }

  /**
   * Resolves to the access token of an existing GitHub session, or
   * null when none is available. Never prompts — silent / passive
   * lookup, used by analyzer-core's githubFetch on every request.
   */
  async getToken(): Promise<string | null> {
    if (this.session) {
      return this.session.accessToken;
    }
    try {
      const session = await vscode.authentication.getSession(
        PROVIDER_ID,
        Array.from(SCOPES),
        { silent: true },
      );
      this.session = session ?? null;
      return session?.accessToken ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Resolves to the cached session if one is already active, without
   * even calling the provider. Used by the rate-limit notification
   * code path to decide whether to offer a "Sign in" action.
   */
  hasActiveSession(): boolean {
    return this.session !== null;
  }

  /**
   * Triggers the interactive consent flow (createIfNone: true). Used
   * by the explicit Sign-in command and the rate-limit toast action.
   * Returns true on success, false on user cancel / error.
   */
  async signIn(): Promise<boolean> {
    try {
      const session = await vscode.authentication.getSession(
        PROVIDER_ID,
        Array.from(SCOPES),
        { createIfNone: true },
      );
      this.session = session ?? null;
      this.emitter.fire();
      return session !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Forgets the cached session reference and prompts the user to
   * remove the session from the Accounts gear menu (VSCode does not
   * expose a programmatic sign-out for the GitHub provider). Returns
   * a boolean indicating whether we had a session to forget.
   */
  signOut(): boolean {
    if (!this.session) {
      return false;
    }
    this.session = null;
    this.emitter.fire();
    return true;
  }

  /** Drops the session-change subscription and the change emitter. */
  dispose(): void {
    this.subscription.dispose();
    this.emitter.dispose();
  }
}
