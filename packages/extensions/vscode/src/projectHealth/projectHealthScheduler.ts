/**
 * External dependencies.
 */
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { ProjectHealthAutoRun } from "../diagnostics/settings";
import type { ProjectHealthScope } from "./types";

/**
 * Backstop interval while the editor window stays open (1 hour). The
 * primary trigger is "due on activation"; this tick catches the case
 * where a machine is left running past the daily boundary.
 */
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

/** The slice of the controller the scheduler needs. */
export interface SchedulableController {
  readonly isRunning: boolean;
  isRunDue(dueAfterMs?: number): boolean;
  run(options: {
    scope?: ProjectHealthScope;
    notify?: boolean;
  }): Promise<unknown>;
}

export interface ProjectHealthSchedulerDeps {
  controller: SchedulableController;
  settingsProvider: () => { projectHealthAutoRun: ProjectHealthAutoRun };
  intervalMs?: number;
  /** Injectable timers so tests can drive the schedule deterministically. */
  timers?: {
    setInterval: (handler: () => void, ms: number) => unknown;
    clearInterval: (handle: unknown) => void;
  };
}

/**
 * Drives the optional daily dependency health check. Uses the
 * editor-friendly "due on activation + interval while open" model rather
 * than a wall clock cron: it checks on start and once an hour while the
 * window is open, running only when the user opted into `daily`, no run is
 * already in flight, and the durable cache says a run is due (last
 * completed run is older than a day). Scheduled runs cover only the
 * dependency scope (vulnerabilities + licenses) so the slow project
 * analysis never runs unattended, and notify the user with a summary.
 */
export class ProjectHealthScheduler implements vscode.Disposable {
  private readonly controller: SchedulableController;
  private readonly settingsProvider: () => {
    projectHealthAutoRun: ProjectHealthAutoRun;
  };
  private readonly intervalMs: number;
  private readonly timers: NonNullable<ProjectHealthSchedulerDeps["timers"]>;
  private handle: unknown = null;

  /** Stores the controller, settings reader, interval, and timer hooks. */
  constructor(deps: ProjectHealthSchedulerDeps) {
    this.controller = deps.controller;
    this.settingsProvider = deps.settingsProvider;
    this.intervalMs = deps.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.timers = deps.timers ?? {
      setInterval: (handler, ms) => setInterval(handler, ms),
      clearInterval: (handleValue) =>
        clearInterval(handleValue as ReturnType<typeof setInterval>),
    };
  }

  /**
   * Runs the due-on-activation check immediately and arms the hourly
   * backstop. Safe to call once at activation.
   */
  start(): void {
    this.checkNow();
    if (this.handle === null) {
      this.handle = this.timers.setInterval(
        () => this.checkNow(),
        this.intervalMs,
      );
    }
  }

  /**
   * Evaluates whether a scheduled run should start right now. Exposed so
   * the extension can re-check immediately when the user flips the
   * autoRun setting rather than waiting for the next interval tick.
   */
  checkNow(): void {
    if (this.settingsProvider().projectHealthAutoRun !== "daily") {
      return;
    }
    if (this.controller.isRunning) {
      return;
    }
    if (!this.controller.isRunDue()) {
      return;
    }
    void this.controller.run({ scope: "dependencies", notify: true });
  }

  /** Clears the backstop interval. */
  dispose(): void {
    if (this.handle !== null) {
      this.timers.clearInterval(this.handle);
      this.handle = null;
    }
  }
}
