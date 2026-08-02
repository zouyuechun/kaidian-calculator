import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetFile = path.join(
  projectRoot,
  "node_modules",
  "vinext",
  "dist",
  "server",
  "static-file-cache.js",
);

const windowsBrokenLine = "relativePath: path.relative(base, batch[j]),";
const windowsFixedLine =
  'relativePath: path.relative(base, batch[j]).split(path.sep).join("/"),';

const source = await readFile(targetFile, "utf8");

if (source.includes(windowsFixedLine)) {
  process.exit(0);
}

if (!source.includes(windowsBrokenLine)) {
  throw new Error("Unsupported vinext static file cache implementation.");
}

await writeFile(
  targetFile,
  source.replace(windowsBrokenLine, windowsFixedLine),
  "utf8",
);
