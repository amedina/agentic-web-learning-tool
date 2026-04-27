/**
 * External dependencies
 */
import { useState, useEffect, useCallback } from "react";
import { Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  InputGroup,
  OptionsPageTabSection,
  toast,
} from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import {
  GITHUB_PAT_STORAGE_KEY,
  githubAuthService,
} from "../../../../serviceWorker/services/githubAuth";

type GithubUser = { login: string } | null;

async function validateToken(token: string): Promise<GithubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { login?: string };
  return data?.login ? { login: data.login } : null;
}

export default function GithubAuthSection() {
  const [token, setToken] = useState<string>("");
  const [savedToken, setSavedToken] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [user, setUser] = useState<GithubUser>(null);
  const [instructionsOpen, setInstructionsOpen] = useState<boolean>(false);

  useEffect(() => {
    githubAuthService.getToken().then(async (existing) => {
      if (existing) {
        setToken(existing);
        setSavedToken(existing);
        // Resolve the user silently so the status row reads "Connected as @x".
        const result = await validateToken(existing);
        setUser(result);
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      return;
    }
    setIsSaving(true);
    const result = await validateToken(trimmed);
    if (!result) {
      toast.error("Invalid token. Check the value and try again.");
      setIsSaving(false);
      return;
    }
    await githubAuthService.setToken(trimmed);
    setSavedToken(trimmed);
    setUser(result);
    toast.success(`GitHub token saved. Connected as @${result.login}.`);
    setIsSaving(false);
  }, [token]);

  const handleRemove = useCallback(async () => {
    await githubAuthService.clearToken();
    setToken("");
    setSavedToken("");
    setUser(null);
    toast.success("GitHub token removed.");
  }, []);

  const isUnchanged = token.trim() === savedToken;
  const isConnected = !!savedToken;

  return (
    <OptionsPageTabSection title="GitHub Authentication">
      <div className="flex flex-col gap-4 max-w-xl">
        <p className="text-xs text-amethyst-haze">
          Without a token, GitHub allows{" "}
          <span className="font-medium">60 API requests per hour</span>. Adding
          a Personal Access Token raises the limit to{" "}
          <span className="font-medium">5,000 per hour</span>. The token is
          stored locally in your browser only and is never synced.
        </p>

        <div
          className={`flex items-center gap-2 text-xs ${
            isConnected ? "text-green-600" : "text-amethyst-haze"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-slate-400"
            }`}
          />
          {isConnected
            ? user
              ? `Connected as @${user.login} — 5,000 req/hr limit`
              : "Token saved — 5,000 req/hr limit"
            : "Not connected — using the 60 req/hr unauthenticated limit"}
        </div>

        <div className="flex items-end gap-2">
          <InputGroup label="Personal Access Token" className="w-full">
            <div className="relative">
              <Input
                id={GITHUB_PAT_STORAGE_KEY}
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="github_pat_…"
                className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm"
              />
              <ShieldCheck className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
            </div>
          </InputGroup>
          <Button
            type="button"
            onClick={() => setShowToken((prev) => !prev)}
            disabled={!token}
          >
            {showToken ? "Hide" : "Show"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!token || isUnchanged || isSaving}
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isConnected ? "Update Token" : "Save Token"}
          </Button>
          {isConnected && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={isSaving}
            >
              Remove
            </Button>
          )}
        </div>

        <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-medium text-text-primary hover:underline"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  instructionsOpen ? "rotate-180" : ""
                }`}
              />
              How to generate a token
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-xs text-amethyst-haze">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Visit{" "}
                <a
                  href="https://github.com/settings/personal-access-tokens/new"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-text-primary underline"
                >
                  github.com/settings/personal-access-tokens/new
                </a>{" "}
                (fine-grained tokens).
              </li>
              <li>Give the token a name and an expiration.</li>
              <li>
                Under <span className="font-medium">Repository access</span>,
                "Public Repositories (read-only)" is sufficient.
              </li>
              <li>
                No additional permissions are required — public read works
                without scopes.
              </li>
              <li>Click "Generate token" and copy the value.</li>
              <li>Paste it above and click "Save Token".</li>
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </OptionsPageTabSection>
  );
}
