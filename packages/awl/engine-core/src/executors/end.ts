/**
 * End executor.
 */
export async function endExecutor(config: Record<string, unknown>) {
  return (config.input as string) || '';
}
