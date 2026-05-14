import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = process.cwd();
const outdir = path.join(root, ".tmp-tests");
const outfile = path.join(outdir, "core.test.mjs");

async function resolveSourceAlias(specifier) {
  const basePath = path.join(root, "src", specifier.slice(2));
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.mjs"),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next extension candidate.
    }
  }

  return basePath;
}

const aliasPlugin = {
  name: "posterengine-alias",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@\// }, async (args) => ({
      path: await resolveSourceAlias(args.path),
    }));
  },
};

await mkdir(outdir, { recursive: true });
await build({
  entryPoints: [path.join(root, "tests", "core.test.ts")],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: "inline",
  packages: "external",
  plugins: [aliasPlugin],
  logLevel: "silent",
});

await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
console.log("Core tests passed.");
