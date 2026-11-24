import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resources = path.join(root, "resources");
const api = "https://json.tarkov.dev";
const mapCatalogUrl =
  "https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/src/data/maps.json";

async function getJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "TarkovCompanion/0.1" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function saveJson(relativePath, value) {
  const destination = path.join(resources, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const entry of value) walk(entry, visit);
    return;
  }
  visit(value);
  for (const entry of Object.values(value)) walk(entry, visit);
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function download(url, relativePath) {
  const response = await fetch(url, { headers: { "user-agent": "TarkovCompanion/0.1" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const destination = path.join(resources, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, new Uint8Array(await response.arrayBuffer()));
}

async function downloadAll(entries, onSuccess, concurrency = 8) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, entries.length) }, async () => {
      while (next < entries.length) {
        const entry = entries[next++];
        try {
          await entry.run();
          onSuccess();
        } catch (error) {
          failures.push(String(error));
        }
      }
    }),
  );
}

const failures = [];

async function main() {
  const mode = process.argv.includes("--pve") ? "pve" : "regular";
  console.log(`Fetching ${mode} map and item data from tarkov.dev...`);
  const [mapResponse, itemsResponse, mapCatalog] = await Promise.all([
    getJson(`${api}/${mode}/maps`),
    getJson(`${api}/${mode}/items`),
    getJson(mapCatalogUrl),
  ]);

  const maps = mapResponse.data?.maps ?? mapResponse.data;
  const items = itemsResponse.data?.items ?? itemsResponse.data;
  if (!maps || !items) throw new Error("Unexpected tarkov.dev API response shape.");

  await saveJson(`maps/${mode}.json`, maps);
  await saveJson("icons/items.json", items);

  const svgUrls = new Set();
  for (const entry of mapCatalog) {
    for (const map of entry.maps ?? []) {
      if (map.svgPath) svgUrls.add(map.svgPath);
    }
  }

  let mapsSaved = 0;
  await downloadAll(
    [...svgUrls].map((url) => ({
      run: async () => {
        const name = path.posix.basename(new URL(url).pathname);
        await download(url, `maps/svg/${safeName(name)}`);
      },
    })),
    () => mapsSaved++,
  );

  const iconUrls = new Map();
  walk(items, (item) => {
    if (typeof item.id !== "string") return;
    for (const field of ["iconLink", "baseImageLink"]) {
      const url = item[field];
      if (typeof url === "string" && url.startsWith("https://")) {
        iconUrls.set(`${field}:${item.id}`, { field, id: item.id, url });
      }
    }
  });

  let iconsSaved = 0;
  await downloadAll(
    [...iconUrls.values()].map(({ field, id, url }) => ({
      run: async () => {
        const extension = path.extname(new URL(url).pathname) || ".png";
        const folder = field === "iconLink" ? "icons/items" : "images/items";
        await download(url, `${folder}/${safeName(id)}${extension}`);
      },
    })),
    () => iconsSaved++,
  );

  await saveJson("maps/catalog.json", mapCatalog);
  console.log(`Saved map data, ${mapsSaved} map SVGs, and ${iconsSaved} item images.`);
  if (failures.length) {
    console.warn(`${failures.length} asset downloads failed; first failures:`);
    for (const failure of failures.slice(0, 10)) console.warn(`- ${failure}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
