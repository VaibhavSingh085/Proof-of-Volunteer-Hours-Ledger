#!/usr/bin/env node
/**
 * Copy managed folder and .compact source to dist after TypeScript build
 */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src");
const dist = join(root, "dist");

if (!existsSync(join(dist))) {
  mkdirSync(dist, { recursive: true });
}

const managedSrc = join(src, "managed");
const managedDist = join(dist, "managed");
if (existsSync(managedSrc)) {
  cpSync(managedSrc, managedDist, { recursive: true });
  console.log("Copied managed/ to dist/");
}

const compactFiles = ["legaldoc.compact", "counter.compact"];
for (const f of compactFiles) {
  const srcFile = join(src, f);
  if (existsSync(srcFile)) {
    cpSync(srcFile, join(dist, f));
    console.log(`Copied ${f} to dist/`);
  }
}
