import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "AWLT_ENGINE_WEB",
      fileName: (format) => `engine-web.${format}.js`,
      formats: ["iife", "es"],
    },
    sourcemap: true,
  },
});
