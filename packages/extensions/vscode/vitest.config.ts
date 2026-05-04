import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, "src/test/vscodeMock.ts"),
    },
  },
});
