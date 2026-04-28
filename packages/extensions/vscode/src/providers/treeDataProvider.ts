/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { packageStatsService } from "../services/packageStatsService";
import { parsePackageJson } from "../services/packageJsonParser";
import { type PackageStats } from "@google-awlt/package-analyzer-core";

type TreeItem = SectionItem | PackageItem;

class SectionItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly packages: string[],
    public readonly category: "runtime" | "dev",
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "section";
    this.description = `${packages.length} package${packages.length === 1 ? "" : "s"}`;
  }
}

class PackageItem extends vscode.TreeItem {
  constructor(
    public readonly packageName: string,
    public readonly category: "runtime" | "dev",
    stats: PackageStats | null | "loading" | "error",
  ) {
    super(packageName, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "package";
    this.command = {
      command: "npmAdvisor.openOnNpm",
      title: "Open on npmjs.com",
      arguments: [packageName],
    };

    if (stats === "loading") {
      this.description = "analysing…";
      this.iconPath = new vscode.ThemeIcon("loading~spin");
    } else if (stats === "error" || stats === null) {
      this.description = "not found";
      this.iconPath = new vscode.ThemeIcon("question");
    } else {
      const score = stats.score;
      const critical = stats.securityAdvisories?.critical ?? 0;
      const high = stats.securityAdvisories?.high ?? 0;

      this.description = `${score}/${stats.scoreMaxPoints}`;
      this.tooltip = buildTooltip(packageName, stats);

      if (critical > 0) {
        this.iconPath = new vscode.ThemeIcon(
          "error",
          new vscode.ThemeColor("charts.red"),
        );
      } else if (high > 0 || score < 40) {
        this.iconPath = new vscode.ThemeIcon(
          "warning",
          new vscode.ThemeColor("charts.yellow"),
        );
      } else if (score >= 70) {
        this.iconPath = new vscode.ThemeIcon(
          "pass",
          new vscode.ThemeColor("charts.green"),
        );
      } else {
        this.iconPath = new vscode.ThemeIcon("circle-filled");
      }
    }
  }
}

function buildTooltip(
  name: string,
  stats: PackageStats,
): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.supportThemeIcons = true;
  md.appendMarkdown(
    `**${name}** — Score: **${stats.score}/${stats.scoreMaxPoints}**\n\n`,
  );
  if (stats.stars !== null) {
    md.appendMarkdown(`$(star) ${stats.stars.toLocaleString()} stars\n\n`);
  }
  if (stats.license) {
    md.appendMarkdown(`$(law) ${stats.license}\n\n`);
  }
  if (stats.securityAdvisories) {
    const { critical, high, moderate, low } = stats.securityAdvisories;
    const total = critical + high + moderate + low;
    md.appendMarkdown(
      total > 0
        ? `$(shield) ${total} security advisor${total === 1 ? "y" : "ies"}\n\n`
        : `$(shield) No advisories\n\n`,
    );
  }
  return md;
}

export class NpmAdvisorTreeDataProvider
  implements vscode.TreeDataProvider<TreeItem>, vscode.Disposable
{
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private sections: SectionItem[] = [];
  private statsMap = new Map<
    string,
    PackageStats | null | "loading" | "error"
  >();
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (
          document.fileName.endsWith("package.json") &&
          !document.fileName.includes("node_modules")
        ) {
          void this.refresh();
        }
      }),
    );
  }

  async refresh(): Promise<void> {
    this.statsMap.clear();
    await this.loadFromWorkspace();
  }

  async loadFromWorkspace(): Promise<void> {
    const uris = await vscode.workspace.findFiles(
      "package.json",
      "**/node_modules/**",
      1,
    );
    if (uris.length === 0) {
      this.sections = [];
      this._onDidChangeTreeData.fire();
      return;
    }

    const parsed = await parsePackageJson(uris[0]);
    if (!parsed) {
      this.sections = [];
      this._onDidChangeTreeData.fire();
      return;
    }

    await vscode.commands.executeCommand(
      "setContext",
      "npmAdvisor.hasPackageJson",
      true,
    );

    const newSections: SectionItem[] = [];
    if (parsed.dependencies.length > 0) {
      newSections.push(
        new SectionItem("Dependencies", parsed.dependencies, "runtime"),
      );
    }
    if (parsed.devDependencies.length > 0) {
      newSections.push(
        new SectionItem("Dev Dependencies", parsed.devDependencies, "dev"),
      );
    }
    if (parsed.peerDependencies.length > 0) {
      newSections.push(
        new SectionItem(
          "Peer Dependencies",
          parsed.peerDependencies,
          "runtime",
        ),
      );
    }

    this.sections = newSections;

    // Initialise all packages as loading and render immediately.
    for (const section of newSections) {
      for (const name of section.packages) {
        this.statsMap.set(name, "loading");
      }
    }
    this._onDidChangeTreeData.fire();

    // Fetch stats progressively and fire updates per package.
    const allEntries: Array<{ name: string; category: "runtime" | "dev" }> = [];
    for (const section of newSections) {
      for (const name of section.packages) {
        allEntries.push({ name, category: section.category });
      }
    }

    let queueIndex = 0;
    const CONCURRENCY = 4;

    const runWorker = async () => {
      while (true) {
        const index = queueIndex++;
        if (index >= allEntries.length) {
          return;
        }
        const { name, category } = allEntries[index];
        try {
          const stats = await packageStatsService.getLightStats(name, category);
          this.statsMap.set(name, stats);
        } catch {
          this.statsMap.set(name, "error");
        }
        this._onDidChangeTreeData.fire();
      }
    };

    const workerCount = Math.min(CONCURRENCY, allEntries.length);
    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
    if (!element) {
      return this.sections;
    }

    if (element instanceof SectionItem) {
      return element.packages.map(
        (name) =>
          new PackageItem(
            name,
            element.category,
            this.statsMap.get(name) ?? "loading",
          ),
      );
    }

    return [];
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
