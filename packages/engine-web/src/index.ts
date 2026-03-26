import { initWebWorkflow } from "./client/WebWorkflowClient";

export { initWebWorkflow };

if (typeof window !== "undefined") {
  (window as any).AWLT_ENGINE_WEB = { initWebWorkflow };
}
