import { cp, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const release = path.join(root, "apps/desktop/src-tauri/target/release");
const output = path.join(release, "bundle/nsis");

await mkdir(output, { recursive: true });
await copyFile(
  path.join(release, "tarkov-companion.exe"),
  path.join(output, "tarkov-companion.exe"),
);
await cp(path.join(release, "_up_"), path.join(output, "_up_"), {
  recursive: true,
  force: true,
});

console.log(`Portable app copied next to the installer: ${output}`);
