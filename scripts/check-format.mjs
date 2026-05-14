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

  if (content.length > 0 && !content.endsWith("\n")) {
    failures.push(`${relative}: missing final newline`);
  }

  content.split(/\n/).forEach((line, index) => {
    const lineWithoutCr = line.endsWith("\r") ? line.slice(0, -1) : line;
    if (/[ \t]+$/.test(lineWithoutCr)) {
      failures.push(`${relative}:${index + 1}: trailing whitespace`);
    }
  });
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Format check passed (${files.length} files).`);
