/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { parseDependencies } from "../packageJson/parse";
import type { ActivePackageJsonTracker } from "../workspace/activePackageJsonTracker";
import { buildPackageContext, type ContextDependency } from "./buildContext";

const CHAT_PARTICIPANT_ID = "agentic-web-labs.npm-advisor";
const VERSION_KEY_FOR_CHAT = "latest";

const SYSTEM_PROMPT = `You are NPM Advisor, an assistant focused on npm package selection, security, licensing, and maintenance.

Answer questions about the user's npm dependencies using the package context provided below as ground truth. When the user asks about a specific package, prefer the cached stats over your own knowledge — they are current. When you don't have stats for a mentioned package, say so plainly instead of guessing.

Output rules:
- Use markdown.
- For comparisons, use a small table.
- For lists of packages, use bullet points with the package name in backticks.
- When recommending an alternative, name it explicitly and link to its npm page when you can: https://www.npmjs.com/package/<name>.
- Keep responses concise — the user is reading this in a side chat panel.`;

interface ChatParticipantDeps {
  cache: StatsCache;
  tracker: ActivePackageJsonTracker;
}

/**
 * Registers the @npm-advisor chat participant in VSCode's built-in
 * chat panel. The handler builds a context block from the active
 * package.json + cached stats, picks the user's preferred Copilot
 * model via vscode.lm, and streams the model's reply to the chat
 * surface. When no Copilot model is available the handler renders a
 * polite explanation instead of throwing — the rest of the extension
 * keeps working without Copilot installed.
 *
 * Returns a Disposable so the caller (extension.activate) can track
 * the registration on context.subscriptions.
 */
export function registerChatParticipant(
  deps: ChatParticipantDeps,
): vscode.Disposable {
  const handler: vscode.ChatRequestHandler = async (
    request,
    _chatContext,
    response,
    token,
  ) => {
    const dependencies = collectDependencyContext(deps);
    const activeDocument = deps.tracker.document;

    const contextMarkdown = buildPackageContext({
      prompt: request.prompt,
      activeFileRelativePath: activeDocument
        ? vscode.workspace.asRelativePath(activeDocument.uri, true)
        : null,
      activeFileName: extractPackageName(activeDocument),
      dependencies,
    });

    const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
    if (models.length === 0) {
      response.markdown(
        "**No language model available.** This participant uses GitHub Copilot's models. Install the GitHub Copilot extension and sign in to enable `@npm-advisor`.",
      );
      return;
    }
    const [model] = models;

    const messages = [
      vscode.LanguageModelChatMessage.User(SYSTEM_PROMPT),
      vscode.LanguageModelChatMessage.User(
        `## Package context\n\n${contextMarkdown}`,
      ),
      vscode.LanguageModelChatMessage.User(
        `## User question\n\n${request.prompt}`,
      ),
    ];

    try {
      const reply = await model.sendRequest(messages, {}, token);
      for await (const fragment of reply.text) {
        if (token.isCancellationRequested) {
          return;
        }
        response.markdown(fragment);
      }
    } catch (error) {
      if (token.isCancellationRequested) {
        return;
      }
      response.markdown(
        `\n\n**Could not reach the language model:** ${describeError(error)}`,
      );
    }
  };

  const participant = vscode.chat.createChatParticipant(
    CHAT_PARTICIPANT_ID,
    handler,
  );
  participant.iconPath = vscode.Uri.parse(
    "https://raw.githubusercontent.com/amedina/agentic-web-learning-tool/main/packages/extensions/vscode/media/icon-128-color.png",
  );
  return participant;
}

/**
 * Builds the dependency-context list the chat handler hands to
 * buildPackageContext. Reads the active package.json (if any), pulls
 * cached PackageStats for each dep via cache.peek (no fetch — the
 * chat surface should never wait on the network), and tags each entry
 * with the section it came from for the model's display.
 */
function collectDependencyContext(
  deps: ChatParticipantDeps,
): ContextDependency[] {
  const document = deps.tracker.document;
  if (!document) {
    return [];
  }
  const parsed = parseDependencies(document);
  return parsed.map((entry) => ({
    name: entry.name,
    category: entry.category,
    stats: deps.cache.peek(entry.name, VERSION_KEY_FOR_CHAT) ?? null,
  }));
}

/**
 * Reads the `name` field from a package.json document for display in
 * the context header. Tolerates malformed JSON by returning null.
 */
function extractPackageName(
  document: vscode.TextDocument | null,
): string | null {
  if (!document) {
    return null;
  }
  try {
    const parsed = JSON.parse(document.getText()) as { name?: unknown };
    return typeof parsed.name === "string" ? parsed.name : null;
  } catch {
    return null;
  }
}

/** Best-effort message extraction for chat error rendering. */
function describeError(error: unknown): string {
  if (error instanceof vscode.LanguageModelError) {
    return `${error.code} — ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
