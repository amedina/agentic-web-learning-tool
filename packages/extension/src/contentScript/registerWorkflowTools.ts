import { initWebWorkflow } from '@google-awlt/engine-web';

(() => {
  const client = initWebWorkflow();

  // @ts-expect-error -- window is not typed
  window.awltWorkflow = client;
})();
