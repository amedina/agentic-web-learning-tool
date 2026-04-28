/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { packageStatsService } from "../services/packageStatsService";
import {
  parsePackageJson,
  findPackageNameRange,
  type ParsedPackageJson,
} from "../services/packageJsonParser";
import { type StatusBarManager } from "../statusBar";

const CONCURRENCY = 4;

export class DiagnosticsProvider implements vscode.Disposable {
  private readonly collection: vscode.DiagnosticCollection;
  private readonly disposables: vscode.Disposable[] = [];
  private runId = 0;

  constructor(private readonly statusBar: StatusBarManager) {
    this.collection = vscode.languages.createDiagnosticCollection("npmAdvisor");
  }

  register(): void {
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        if (this.isPackageJson(document)) {
          void this.analyse(document);
        }
      }),
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (this.isPackageJson(document)) {
          packageStatsService.clearCache();
          void this.analyse(document);
        }
      }),
      vscode.workspace.onDidCloseTextDocument((document) => {
        this.collection.delete(document.uri);
      }),
    );

    // Analyse any already-open package.json files on activation.
    for (const document of vscode.workspace.textDocuments) {
      if (this.isPackageJson(document)) {
        void this.analyse(document);
      }
    }
  }

  async analyseUri(uri: vscode.Uri): Promise<void> {
    const document = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uri.toString(),
    );
    if (document) {
      packageStatsService.clearCache();
      await this.analyse(document);
    }
  }

  private isPackageJson(document: vscode.TextDocument): boolean {
    return (
      document.fileName.endsWith("package.json") &&
      !document.fileName.includes("node_modules")
    );
  }

  private async analyse(document: vscode.TextDocument): Promise<void> {
    const config = vscode.workspace.getConfiguration("npmAdvisor");
    if (!config.get<boolean>("diagnosticsEnabled", true)) {
      return;
    }

    const runId = ++this.runId;
    const parsed = await parsePackageJson(document.uri);
    if (!parsed || runId !== this.runId) {
      return;
    }

    const allPackages = buildPackageList(parsed);
    if (allPackages.length === 0) {
      this.collection.set(document.uri, []);
      return;
    }

    this.statusBar.showAnalyzing();

    const diagnostics: vscode.Diagnostic[] = [];
    let issueCount = 0;
    let completed = 0;
    let queueIndex = 0;

    const runWorker = async () => {
      while (true) {
        const index = queueIndex++;
        if (index >= allPackages.length) {
          return;
        }
        if (runId !== this.runId) {
          return;
        }

        const { name, category } = allPackages[index];

        try {
          const stats = await packageStatsService.getLightStats(name, category);
          if (runId !== this.runId) {
            return;
          }

          if (!stats) {
            completed++;
            continue;
          }

          const range = findPackageNameRange(document, name);
          if (!range) {
            completed++;
            continue;
          }

          const critical = stats.securityAdvisories?.critical ?? 0;
          const high = stats.securityAdvisories?.high ?? 0;
          const hasNative =
            (stats.recommendations?.nativeReplacements as unknown[])?.length >
            0;
          const hasPreferred =
            (stats.recommendations?.preferredReplacements as unknown[])
              ?.length > 0;

          if (critical > 0) {
            const diag = new vscode.Diagnostic(
              range,
              `${name}: ${critical} critical security advisor${critical === 1 ? "y" : "ies"} found.`,
              vscode.DiagnosticSeverity.Error,
            );
            diag.source = "NPM Advisor";
            diag.code = {
              value: "security-critical",
              target: vscode.Uri.parse(`https://www.npmjs.com/package/${name}`),
            };
            diagnostics.push(diag);
            issueCount++;
          } else if (high > 0) {
            const diag = new vscode.Diagnostic(
              range,
              `${name}: ${high} high-severity advisor${high === 1 ? "y" : "ies"}.`,
              vscode.DiagnosticSeverity.Warning,
            );
            diag.source = "NPM Advisor";
            diag.code = {
              value: "security-high",
              target: vscode.Uri.parse(`https://www.npmjs.com/package/${name}`),
            };
            diagnostics.push(diag);
            issueCount++;
          } else if (hasNative || hasPreferred) {
            const diag = new vscode.Diagnostic(
              range,
              `${name}: better alternatives or native replacements are available.`,
              vscode.DiagnosticSeverity.Information,
            );
            diag.source = "NPM Advisor";
            diag.code = {
              value: "alternatives-available",
              target: vscode.Uri.parse(`https://www.npmjs.com/package/${name}`),
            };
            diagnostics.push(diag);
          }
        } catch {
          // Network/API errors are silent — we don't want false negatives.
        }

        completed++;
      }
    };

    const workerCount = Math.min(CONCURRENCY, allPackages.length);
    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

    if (runId !== this.runId) {
      return;
    }

    this.collection.set(document.uri, diagnostics);
    this.statusBar.showResults(completed, issueCount);
  }

  dispose(): void {
    this.collection.dispose();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}

interface PackageEntry {
  name: string;
  category: "runtime" | "dev";
}

function buildPackageList(parsed: ParsedPackageJson): PackageEntry[] {
  const seen = new Set<string>();
  const list: PackageEntry[] = [];

  for (const name of [...parsed.dependencies, ...parsed.peerDependencies]) {
    if (!seen.has(name)) {
      seen.add(name);
      list.push({ name, category: "runtime" });
    }
  }

  for (const name of parsed.devDependencies) {
    if (!seen.has(name)) {
      seen.add(name);
      list.push({ name, category: "dev" });
    }
  }

  return list;
}
