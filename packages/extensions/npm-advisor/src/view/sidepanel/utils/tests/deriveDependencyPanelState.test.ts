/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import {
  deriveDependencyPanelState,
  type DependencyPanelStateInputs,
} from "../deriveDependencyPanelState";

const BASE_INPUTS: DependencyPanelStateInputs = {
  loading: false,
  hasStats: false,
  hasError: false,
  notice: null,
  isNavigationMessage: false,
  isOptionsPage: false,
  hasAnalysableDependencies: false,
  pendingPackageName: null,
};

describe("deriveDependencyPanelState", () => {
  it("analyses an unpublished named package that declares dependencies", () => {
    const state = deriveDependencyPanelState({
      ...BASE_INPUTS,
      notice:
        "This package was not found on npmjs.com. It may not be published.",
      hasAnalysableDependencies: true,
      pendingPackageName: "opencode",
    });

    expect(state.showNoticeTakeover).toBe(false);
    expect(state.isDependenciesOnly).toBe(true);
    expect(state.unpublishedPackageName).toBe("opencode");
  });

  it("keeps the notice takeover when an unpublished package has no dependencies", () => {
    const state = deriveDependencyPanelState({
      ...BASE_INPUTS,
      notice:
        "This package was not found on npmjs.com. It may not be published.",
      hasAnalysableDependencies: false,
      pendingPackageName: "opencode",
    });

    expect(state.showNoticeTakeover).toBe(true);
    expect(state.isDependenciesOnly).toBe(false);
    expect(state.unpublishedPackageName).toBeNull();
  });

  it("treats a nameless workspace root with dependencies as deps-only", () => {
    const state = deriveDependencyPanelState({
      ...BASE_INPUTS,
      hasAnalysableDependencies: true,
      pendingPackageName: null,
    });

    expect(state.showNoticeTakeover).toBe(false);
    expect(state.isDependenciesOnly).toBe(true);
    expect(state.unpublishedPackageName).toBeNull();
  });

  it("does not enter deps-only mode while stats are still loading", () => {
    const state = deriveDependencyPanelState({
      ...BASE_INPUTS,
      loading: true,
      hasAnalysableDependencies: true,
      pendingPackageName: "opencode",
    });

    expect(state.isDependenciesOnly).toBe(false);
  });

  it("defers to a published package's own stats over deps-only mode", () => {
    const state = deriveDependencyPanelState({
      ...BASE_INPUTS,
      hasStats: true,
      hasAnalysableDependencies: true,
      pendingPackageName: "react",
    });

    expect(state.isDependenciesOnly).toBe(false);
    expect(state.showNoticeTakeover).toBe(false);
  });

  it("never shows deps-only mode on options or navigation takeovers", () => {
    const optionsState = deriveDependencyPanelState({
      ...BASE_INPUTS,
      isOptionsPage: true,
      hasAnalysableDependencies: true,
    });
    const navigationState = deriveDependencyPanelState({
      ...BASE_INPUTS,
      isNavigationMessage: true,
      hasAnalysableDependencies: true,
    });

    expect(optionsState.isDependenciesOnly).toBe(false);
    expect(navigationState.isDependenciesOnly).toBe(false);
  });
});
