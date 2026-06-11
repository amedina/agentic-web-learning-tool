import { initWebWorkflow } from '@agentic-web-labs/engine-web';

(() => {
  const client = initWebWorkflow();

  // @ts-expect-error -- window is not typed
  window.awltWorkflow = client;
})();
