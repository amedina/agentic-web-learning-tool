/**
 * External dependencies.
 */
import { createContext, useContext, type FC, type ReactNode } from "react";

/**
 * Internal dependencies.
 */
import type {
  PostCopyPrompt,
  PostReveal,
  PostSetupMcp,
} from "../projectAnalysis/types";

/**
 * The callbacks the embedded per-package project analysis needs. They
 * mirror the props of the standalone ProjectAnalysisTab, so the same
 * component can be reused inside a Project Health row.
 */
export interface ProjectAnalysisActions {
  postRunRequest: (requestId: string, packageJsonUri: string) => void;
  postCacheRequest: (requestId: string, packageJsonUri: string) => void;
  postReveal: PostReveal;
  postCopyPrompt: PostCopyPrompt;
  postSetupMcp: PostSetupMcp;
}

/** No-op default so a row rendered outside a provider never crashes. */
const NOOP_ACTIONS: ProjectAnalysisActions = {
  postRunRequest: () => undefined,
  postCacheRequest: () => undefined,
  postReveal: () => undefined,
  postCopyPrompt: () => undefined,
  postSetupMcp: () => undefined,
};

const ProjectAnalysisActionsContext =
  createContext<ProjectAnalysisActions>(NOOP_ACTIONS);

interface ProjectAnalysisActionsProviderProps {
  value: ProjectAnalysisActions;
  children: ReactNode;
}

/** Provides the project-analysis callbacks to embedded row analyses. */
export const ProjectAnalysisActionsProvider: FC<
  ProjectAnalysisActionsProviderProps
> = ({ value, children }) => {
  return (
    <ProjectAnalysisActionsContext.Provider value={value}>
      {children}
    </ProjectAnalysisActionsContext.Provider>
  );
};

/** Reads the project-analysis callbacks supplied by the nearest provider. */
export function useProjectAnalysisActions(): ProjectAnalysisActions {
  return useContext(ProjectAnalysisActionsContext);
}
