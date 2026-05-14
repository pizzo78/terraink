import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([
  ".git",
  ".tmp-tests",
  "dist",
  "node_modules",
  "coverage",
]);
const checkedExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
]);
const forbiddenPatterns = [
  {
    pattern: /%VITE_GOOGLE_SITE_VERIFICATION%/,
    message: "Use the PosterEngine fallback placeholder instead of a raw Vite env token.",
  },
  {
    pattern: /\bRSVG\b/,
    message: "Use SVG or Layered SVG labels.",
  },
  {
    pattern: /\bdebugger\b/,
    message: "Remove debugger statements before committing.",
  },
  {
    pattern: /\.(only|skip)\(/,
    message: "Do not commit focused or skipped tests.",
  },
];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }
      files.push(...await collectFiles(path.join(dir, entry.name)));
      continue;
    }

    if (entry.isFile() && checkedExtensions.has(path.extname(entry.name))) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

const failures = [];
const files = await collectFiles(root);

for (const file of files) {
  const content = await readFile(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  if (relative === "scripts/lint-source.mjs") {
    continue;
  }

  for (const { pattern, message } of forbiddenPatterns) {
    const match = content.match(pattern);
    if (match) {
      failures.push(`${relative}: ${message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Source lint passed (${files.length} files).`);
