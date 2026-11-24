import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "resources/maps");
const output = path.join(root, "apps/desktop/public/maps");

const [mapPayload, catalog] = await Promise.all([
  readFile(path.join(source, "regular.json"), "utf8").then(JSON.parse),
  readFile(path.join(source, "catalog.json"), "utf8").then(JSON.parse),
]);
const maps = mapPayload.data?.maps ?? mapPayload;
const compactMaps = Object.fromEntries(
  Object.entries(maps).map(([id, map]) => [id, {
    id,
    normalizedName: map.normalizedName,
    name: map.name,
    raidDuration: map.raidDuration,
    players: map.players,
    extracts: (map.extracts ?? []).map(({ id: pointId, name, faction, position }) => ({ id: pointId, name, faction, position })),
    spawns: (map.spawns ?? []).map(({ sides, categories, zoneName, position }) => ({ sides, categories, zoneName, position })),
    bosses: (map.bosses ?? []).map(({ mob, spawnLocations }) => ({
      mob,
      spawnLocations: (spawnLocations ?? []).map(({ name, positions }) => ({ name, positions })),
    })),
    lootContainers: (map.lootContainers ?? []).map(({ id: pointId, lootContainer, position }) => ({ id: pointId, lootContainer, position })),
    lootLoose: (map.lootLoose ?? []).map(({ position }) => ({ position })),
    hazards: (map.hazards ?? []).map(({ id: pointId, name, hazardType, position }) => ({ id: pointId, name, hazardType, position })),
    switches: (map.switches ?? []).map(({ id: pointId, name, position }) => ({ id: pointId, name, position })),
    transits: (map.transits ?? []).map(({ id: pointId, description, position }) => ({ id: pointId, description, position })),
    stationaryWeapons: (map.stationaryWeapons ?? []).map(({ stationaryWeapon, position }) => ({ stationaryWeapon, position })),
    btrStops: (map.btrStops ?? []).map(({ name, x, y, z }) => ({ name, x, y, z })),
  }]),
);

const catalogWithViewBoxes = await Promise.all(catalog.map(async (entry) => ({
  ...entry,
  maps: await Promise.all((entry.maps ?? []).map(async (map) => {
    if (!map.svgPath) return map;
    const fileName = path.basename(new URL(map.svgPath).pathname);
    const svg = await readFile(path.join(source, "svg", fileName), "utf8");
    const viewBox = svg.match(/viewBox="[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/);
    if (!viewBox) return map;
    return { ...map, viewBox: [Number(viewBox[1]), Number(viewBox[2])] };
  })),
})));

await mkdir(path.join(output, "svg"), { recursive: true });
await Promise.all([
  writeFile(path.join(output, "regular.json"), `${JSON.stringify({ data: { maps: compactMaps } })}\n`, "utf8"),
  writeFile(path.join(output, "catalog.json"), `${JSON.stringify(catalogWithViewBoxes)}\n`, "utf8"),
  cp(path.join(source, "svg"), path.join(output, "svg"), { recursive: true, force: true }),
]);
