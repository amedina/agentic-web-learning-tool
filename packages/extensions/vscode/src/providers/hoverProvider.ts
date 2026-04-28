/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { packageStatsService } from "../services/packageStatsService";
import { getPackageNameAtPosition } from "../services/packageJsonParser";

export class NpmAdvisorHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Hover | null> {
    if (!document.fileName.endsWith("package.json")) {
      return null;
    }

    const packageInfo = getPackageNameAtPosition(document, position);
    if (!packageInfo) {
      return null;
    }

    const { name, category } = packageInfo;

    let stats;
    try {
      stats = await packageStatsService.getLightStats(name, category);
    } catch {
      return null;
    }

    if (token.isCancellationRequested) {
      return null;
    }

    if (!stats) {
      const md = new vscode.MarkdownString(
        `**$(package) ${name}** — package not found on npm.`,
      );
      md.supportThemeIcons = true;
      return new vscode.Hover(md);
    }

    const md = new vscode.MarkdownString();
    md.supportThemeIcons = true;
    md.isTrusted = true;

    const scoreEmoji =
      stats.score >= 70 ? "🟢" : stats.score >= 40 ? "🟡" : "🔴";
    md.appendMarkdown(
      `**$(package) ${name}** — Score: ${scoreEmoji} **${stats.score}** / ${stats.scoreMaxPoints}\n\n`,
    );

    md.appendMarkdown("---\n\n");

    const rows: string[] = [];

    if (stats.stars !== null) {
      rows.push(`$(star) **Stars** ${stats.stars.toLocaleString()}`);
    }

    if (stats.license) {
      rows.push(`$(law) **License** ${stats.license}`);
    }

    if (stats.lastCommitDate) {
      const date = new Date(stats.lastCommitDate);
      const formatted = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      rows.push(`$(git-commit) **Last commit** ${formatted}`);
    }

    if (stats.securityAdvisories) {
      const { critical, high, moderate, low } = stats.securityAdvisories;
      const total = critical + high + moderate + low;
      if (total > 0) {
        const parts: string[] = [];
        if (critical > 0) parts.push(`${critical} critical`);
        if (high > 0) parts.push(`${high} high`);
        if (moderate > 0) parts.push(`${moderate} moderate`);
        if (low > 0) parts.push(`${low} low`);
        rows.push(`$(shield) **Advisories** ${parts.join(", ")}`);
      } else {
        rows.push(`$(shield) **Advisories** none`);
      }
    }

    if (rows.length > 0) {
      md.appendMarkdown(rows.join(" &nbsp;·&nbsp; ") + "\n\n");
    }

    const hasNative =
      (stats.recommendations?.nativeReplacements as unknown[])?.length > 0;
    const hasPreferred =
      (stats.recommendations?.preferredReplacements as unknown[])?.length > 0;
    if (hasNative || hasPreferred) {
      md.appendMarkdown("---\n\n");
      md.appendMarkdown(
        "$(lightbulb) **Better alternatives available** — open npm page for details.\n\n",
      );
    }

    if (stats.githubUrl) {
      md.appendMarkdown("---\n\n");
      md.appendMarkdown(
        `[$(globe) npm](https://www.npmjs.com/package/${name}) &nbsp; [$(github) GitHub](${stats.githubUrl})`,
      );
    } else {
      md.appendMarkdown("---\n\n");
      md.appendMarkdown(
        `[$(globe) npm](https://www.npmjs.com/package/${name})`,
      );
    }

    return new vscode.Hover(md);
  }
}
