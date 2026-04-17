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
const isContentBuild = process.env.CONTENT_BUILD === "true";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    !isContentBuild &&
      viteStaticCopy({
        targets: [
          { src: resolve(__dirname, "src/manifest.json"), dest: "" },
          { src: resolve(__dirname, "src/icons/*"), dest: "icons" },
        ],
      }),
  ].filter(Boolean),
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      isDev ? "development" : "production",
    ),
  },
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
    lib: isContentBuild
      ? {
          entry: resolve(__dirname, "src/contentScript/contentScript.tsx"),
          name: "contentScript",
          formats: ["iife"],
          fileName: () => "contentScript/contentScript.js",
        }
      : undefined,
    rollupOptions: {
      input: isContentBuild
        ? undefined
        : {
            sidepanel: resolve(__dirname, "src/view/sidepanel/sidePanel.html"),
            options: resolve(__dirname, "src/view/options/options.html"),
            background: resolve(__dirname, "src/background/background.ts"),
          },
      output: {
        entryFileNames: isContentBuild
          ? "contentScript/contentScript.js"
          : "[name]/[name].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: (assetInfo) => {
          if (isContentBuild && assetInfo.name?.endsWith(".css")) {
            return "assets/contentScript.css";
          }
          return "assets/[name]-[hash][extname]";
        },
        format: isContentBuild ? "iife" : "esm",
        inlineDynamicImports: isContentBuild,
      },
    },
  },
});
