/**
 * External dependencies.
 */
import { describe, expect, it, vi } from "vitest";

/**
 * Internal dependencies.
 */
import {
  ProjectHealthScheduler,
  type SchedulableController,
} from "../projectHealthScheduler";

/** Builds a fake controller with tunable running / due state. */
function fakeController(
  options: { isRunning?: boolean; isRunDue?: boolean } = {},
): SchedulableController & { run: ReturnType<typeof vi.fn> } {
  return {
    isRunning: options.isRunning ?? false,
    isRunDue: () => options.isRunDue ?? true,
    run: vi.fn().mockResolvedValue(undefined),
  };
}

/** Captures the interval handler so tests can fire ticks manually. */
function captureTimers() {
  const state: { handler: (() => void) | null; cleared: boolean } = {
    handler: null,
    cleared: false,
  };
  return {
    state,
    timers: {
      setInterval: (handler: () => void) => {
        state.handler = handler;
        return 1;
      },
      clearInterval: () => {
        state.cleared = true;
      },
    },
  };
}

describe("ProjectHealthScheduler", () => {
  it("runs on start when autoRun is daily, due, and idle", () => {
    const controller = fakeController();
    const { timers } = captureTimers();
    const scheduler = new ProjectHealthScheduler({
      controller,
      settingsProvider: () => ({ projectHealthAutoRun: "daily" }),
      timers,
    });

    scheduler.start();

    expect(controller.run).toHaveBeenCalledWith({ notify: true });
  });

  it("does nothing when autoRun is off", () => {
    const controller = fakeController();
    const { timers } = captureTimers();
    const scheduler = new ProjectHealthScheduler({
      controller,
      settingsProvider: () => ({ projectHealthAutoRun: "off" }),
      timers,
    });

    scheduler.start();

    expect(controller.run).not.toHaveBeenCalled();
  });

  it("does not run when a run is not due", () => {
    const controller = fakeController({ isRunDue: false });
    const { timers } = captureTimers();
    const scheduler = new ProjectHealthScheduler({
      controller,
      settingsProvider: () => ({ projectHealthAutoRun: "daily" }),
      timers,
    });

    scheduler.checkNow();

    expect(controller.run).not.toHaveBeenCalled();
  });

  it("does not run when one is already in flight", () => {
    const controller = fakeController({ isRunning: true });
    const { timers } = captureTimers();
    const scheduler = new ProjectHealthScheduler({
      controller,
      settingsProvider: () => ({ projectHealthAutoRun: "daily" }),
      timers,
    });

    scheduler.checkNow();

    expect(controller.run).not.toHaveBeenCalled();
  });

  it("re-checks on the hourly backstop tick", () => {
    const controller = fakeController();
    const { state, timers } = captureTimers();
    let isDaily = false;
    const scheduler = new ProjectHealthScheduler({
      controller,
      settingsProvider: () => ({
        projectHealthAutoRun: isDaily ? "daily" : "off",
      }),
      timers,
    });

    scheduler.start();
    expect(controller.run).not.toHaveBeenCalled();

    // The user enables daily; the next backstop tick should run.
    isDaily = true;
    state.handler?.();
    expect(controller.run).toHaveBeenCalledTimes(1);
  });

  it("clears the interval on dispose", () => {
    const controller = fakeController();
    const { state, timers } = captureTimers();
    const scheduler = new ProjectHealthScheduler({
      controller,
      settingsProvider: () => ({ projectHealthAutoRun: "off" }),
      timers,
    });

    scheduler.start();
    scheduler.dispose();

    expect(state.cleared).toBe(true);
  });
});
