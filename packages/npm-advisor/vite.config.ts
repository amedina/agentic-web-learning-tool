import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import svgr from "vite-plugin-svgr";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
import { readdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../../dist/npm-advisor");
const packagesDir = resolve(__dirname, "../");
const aliases = readdirSync(packagesDir)
  .filter((name) => name !== "shared-config")
  .map((name) => ({
    find: `@google-awlt/${name}`,
    replacement: resolve(packagesDir, name, "src"),
  }));

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    viteStaticCopy({
      targets: [
        { src: resolve(__dirname, "src/manifest.json"), dest: "" },
        { src: resolve(__dirname, "src/icons/*"), dest: "icons" },
      ],
    }),
  ],
  base: "",
  root: "src/view",
  resolve: {
    alias: aliases,
  },
  build: {
    emptyOutDir: false,
    watch: isDev ? {} : null,
    sourcemap: isDev ? true : false,
    minify: !isDev,
    outDir: distDir,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "src/view/sidepanel/sidepanel.html"),
        options: resolve(__dirname, "src/view/options/options.html"),
        contentScript: resolve(__dirname, "src/contentScript/contentScript.ts"),
        background: resolve(__dirname, "src/background/background.ts"),
      },
      output: {
        entryFileNames: "[name]/[name].js",
      },
    },
  },
});
