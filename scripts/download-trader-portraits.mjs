import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "resources/images/traders");
const response = await fetch("https://json.tarkov.dev/regular/traders", {
  headers: { "user-agent": "TarkovCompanion/0.1 (trader portraits)" },
});
if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

const payload = await response.json();
const traders = Object.values(payload.data?.traders ?? payload.data ?? {});
await mkdir(output, { recursive: true });

let saved = 0;
for (const trader of traders) {
  if (!trader.normalizedName || !trader.imageLink) continue;
  const image = await fetch(trader.imageLink, {
    headers: { "user-agent": "TarkovCompanion/0.1 (trader portraits)" },
  });
  if (!image.ok) {
    console.warn(`Could not download ${trader.normalizedName}: ${image.status}`);
    continue;
  }
  await writeFile(path.join(output, `${trader.normalizedName}.webp`), new Uint8Array(await image.arrayBuffer()));
  saved++;
}

console.log(`Saved ${saved} trader portraits to ${output}.`);
