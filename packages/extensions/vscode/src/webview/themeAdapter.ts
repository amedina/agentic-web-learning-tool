/**
 * VSCode injects a single class on `<body>` to communicate the active
 * color theme: `vscode-dark`, `vscode-light`, or `vscode-high-contrast`
 * (with optional `vscode-high-contrast-light`). Tailwind's `dark:`
 * variant is configured against `&:is(.dark *)`, so we mirror VSCode's
 * choice onto a `dark` class on the `<html>` element.
 *
 * Returns a teardown function that disconnects the observer.
 */
export function installVscodeThemeMirror(
  target: HTMLElement = document.documentElement,
): () => void {
  const apply = (): void => {
    const body = document.body;
    const isDark =
      body.classList.contains("vscode-dark") ||
      (body.classList.contains("vscode-high-contrast") &&
        !body.classList.contains("vscode-high-contrast-light"));
    target.classList.toggle("dark", isDark);
  };

  apply();

  const observer = new MutationObserver(apply);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}
