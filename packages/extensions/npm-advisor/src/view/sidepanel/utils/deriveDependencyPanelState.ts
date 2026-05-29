export interface DependencyPanelStateInputs {
  loading: boolean;
  hasStats: boolean;
  hasError: boolean;
  notice: string | null;
  isNavigationMessage: boolean;
  isOptionsPage: boolean;
  hasAnalysableDependencies: boolean;
  pendingPackageName: string | null;
}

export interface DependencyPanelState {
  /**
   * True when the panel should take over the whole view with the notice
   * card — only when npm returned nothing AND there are no declared
   * dependencies left to analyze.
   */
  showNoticeTakeover: boolean;
  /**
   * True when the panel should render the tab shell with a deps-only
   * Insights empty state: there's no published package to score, but the
   * page declares dependencies the Dependencies tab can still analyze.
   */
  isDependenciesOnly: boolean;
  /**
   * The unpublished package name to surface in the Insights card, or null
   * for a nameless workspace / monorepo root (which has no notice).
   */
  unpublishedPackageName: string | null;
}

/**
 * Decides how the side panel renders a package.json page that has no
 * published package stats. Keeps a package.json with declared dependencies
 * analysable even when its own `name` is missing or unpublished on npm,
 * instead of replacing the panel with a "not found on npm" notice.
 */
export function deriveDependencyPanelState(
  inputs: DependencyPanelStateInputs,
): DependencyPanelState {
  const isDependenciesOnly =
    !inputs.loading &&
    !inputs.hasStats &&
    !inputs.hasError &&
    !inputs.isNavigationMessage &&
    !inputs.isOptionsPage &&
    inputs.hasAnalysableDependencies;

  const unpublishedPackageName =
    isDependenciesOnly && inputs.notice ? inputs.pendingPackageName : null;

  const showNoticeTakeover =
    !!inputs.notice && !inputs.hasAnalysableDependencies;

  return { showNoticeTakeover, isDependenciesOnly, unpublishedPackageName };
}
