import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf8"),
);
const appVersion = String(packageJson.version ?? "0.0.0");
const MAPLIBRE_DEP_PACKAGES = new Set([
  "earcut",
  "gl-matrix",
  "kdbush",
  "murmurhash-js",
  "pbf",
  "potpack",
  "quickselect",
  "supercluster",
  "tinyqueue",
]);

function getPackageName(id) {
  const nodeModulesMatch = id.match(/[\\/]node_modules[\\/](.*)$/);
  if (!nodeModulesMatch || !nodeModulesMatch[1]) return null;

  const modulePath = nodeModulesMatch[1];
  const parts = modulePath.split(/[\\/]/);
  if (parts.length === 0) return null;

  if (parts[0].startsWith("@") && parts.length > 1) {
    return `${parts[0]}/${parts[1]}`;
  }

  return parts[0];
}

function googleVerificationFallbackPlugin(value) {
  return {
    name: "posterengine-google-verification-fallback",
    enforce: "pre",
    transformIndexHtml(html) {
      return html.replace(
        /__POSTERENGINE_GOOGLE_SITE_VERIFICATION__/g,
        value || "",
      );
    },
  };
}

function serviceWorkerPrecachePlugin() {
  return {
    name: "posterengine-service-worker-precache",
    writeBundle(options, bundle) {
      const buildAssetUrls = Object.values(bundle)
        .map((item) => item.fileName)
        .filter((fileName) => /\.(?:css|js)$/.test(fileName))
        .map((fileName) => `/${fileName}`)
        .sort();
      const cacheVersion = crypto
        .createHash("sha256")
        .update([appVersion, ...buildAssetUrls].join("\n"))
        .digest("hex")
        .slice(0, 12);
      const outDir = path.resolve(__dirname, options.dir || "dist");
      const swSourcePath = path.resolve(__dirname, "public", "sw.js");
      const swOutputPath = path.join(outDir, "sw.js");
      const source = fs
        .readFileSync(swSourcePath, "utf8")
        .replace(
          'const BUILD_CACHE_VERSION = "dev";',
          `const BUILD_CACHE_VERSION = ${JSON.stringify(cacheVersion)};`,
        )
        .replace(
          "const BUILD_ASSET_URLS = [];",
          `const BUILD_ASSET_URLS = ${JSON.stringify(buildAssetUrls, null, 2)};`,
        );

      fs.writeFileSync(swOutputPath, source);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      googleVerificationFallbackPlugin(env.VITE_GOOGLE_SITE_VERIFICATION),
      react(),
      serviceWorkerPrecachePlugin(),
    ],
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    },
    build: {
      // maplibre-gl is distributed as a large prebundled module and remains a
      // single chunk even with manual chunking.
      chunkSizeWarningLimit: 1100,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            const packageName = getPackageName(id);

            if (packageName === "maplibre-gl") {
              return "vendor-maplibre-core";
            }

            if (
              packageName?.startsWith("@maplibre/") ||
              packageName?.startsWith("@mapbox/") ||
              MAPLIBRE_DEP_PACKAGES.has(packageName)
            ) {
              return "vendor-maplibre-deps";
            }

            if (packageName?.startsWith("react-icons")) {
              return "vendor-icons";
            }

            if (
              packageName === "react" ||
              packageName === "react-dom" ||
              packageName === "react-colorful"
            ) {
              return "vendor-react";
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
