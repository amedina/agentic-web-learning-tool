/**
 * End executor.
 */
export async function endExecutor(config: unknown) {
  return (config as { input: string })?.input || '';
}
