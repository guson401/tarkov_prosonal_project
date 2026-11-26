import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "resources/maps");
const output = path.join(root, "apps/desktop/public/maps");
const questsSource = path.join(root, "resources/quests/quests.en.json");
const questConditionsSource = path.join(root, "resources/quests/quest-conditions.source.json");
const questsOutput = path.join(root, "apps/desktop/public/quests");
const traderImagesSource = path.join(root, "resources/images/traders");
const traderImagesOutput = path.join(root, "apps/desktop/public/images/traders");
const itemsSource = path.join(root, "resources/icons/items.json");
const injectorIconsSource = path.join(root, "resources/icons/items");
const itemIconsOutput = path.join(root, "apps/desktop/public/images/items");
const injectorIconsOutput = path.join(root, "apps/desktop/public/images/injectors");
const ballisticIconsOutput = path.join(root, "apps/desktop/public/images/ammo");

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
await mkdir(questsOutput, { recursive: true });
await mkdir(traderImagesOutput, { recursive: true });
await mkdir(injectorIconsOutput, { recursive: true });
await mkdir(ballisticIconsOutput, { recursive: true });
await mkdir(itemIconsOutput, { recursive: true });
const hasTraderImages = await stat(traderImagesSource).then((info) => info.isDirectory()).catch(() => false);
const items = JSON.parse(await readFile(itemsSource, "utf8"));
const itemPropertyKeys = ["propertiesType", "caliber", "damage", "armorDamage", "penetrationPower", "ergonomics", "recoilVertical", "recoilHorizontal", "fireRate", "armorClass", "maxDurability", "useTime", "cures", "stackMaxSize", "ammoType"];
const humanizeItemName = (value) => value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bM4a1\b/g, "M4A1").replace(/\bAk\b/g, "AK").replace(/\bSj(\d*)\b/g, "SJ$1");
const itemPayload = Object.values(items).map((item) => ({
  id: item.id,
  name: item.name && !item.name.endsWith(" Name") ? item.name : humanizeItemName(item.normalizedName ?? item.id),
  normalizedName: item.normalizedName ?? "",
  types: (item.types ?? []).filter((type) => !["noFlea", "markedOnly"].includes(type)),
  width: item.width ?? 1,
  height: item.height ?? 1,
  weight: item.weight ?? null,
  basePrice: item.basePrice ?? null,
  wikiLink: item.wikiLink ?? "",
  icon: `/images/items/${item.id}.webp`,
  properties: item.properties ? Object.fromEntries(itemPropertyKeys.filter((key) => item.properties[key] !== undefined && item.properties[key] !== null).map((key) => [key, item.properties[key]])) : {},
}));
await writeFile(path.join(root, "apps/desktop/public/items.json"), `${JSON.stringify(itemPayload)}\n`, "utf8");
const injectors = Object.values(items).filter((item) => ["ItemPropertiesStim", "ItemPropertiesPainkiller"].includes(item.properties?.propertiesType) && item.normalizedName?.endsWith("injector"));
const injectorLabels = {
  "3-b-tg-stimulant-injector": "3-(b-TG)", "2a2-b-tg-stimulant-injector": "2A2-(b-TG)",
  "l1-norepinephrine-injector": "L1 (Norepinephrine)", "p22-product-22-stimulant-injector": "P22 (Product 22)",
  "pnb-product-16-stimulant-injector": "PNB (Product 16)", "ahf1-m-stimulant-injector": "AHF1-M",
  "sj1-tglabs-combat-stimulant-injector": "SJ1 TGLabs", "sj6-tglabs-combat-stimulant-injector": "SJ6 TGLabs",
  "sj9-tglabs-combat-stimulant-injector": "SJ9 TGLabs", "sj12-tglabs-combat-stimulant-injector": "SJ12 TGLabs",
  "mule-stimulant-injector": "M.U.L.E.", "obdolbos-cocktail-injector": "Obdolbos", "obdolbos-2-cocktail-injector": "Obdolbos 2",
  "etg-change-regenerative-stimulant-injector": "ETG-change", "perfotoran-blue-blood-stimulant-injector": "Perfotoran (Blue Blood)",
  "xtg-12-antidote-injector": "XTG-12", "propital-regenerative-stimulant-injector": "Propital",
  "zagustin-hemostatic-drug-injector": "Zagustin", "morphine-injector": "Morphine",
};
const injectorPayload = injectors.map((item) => ({
  id: item.id,
  name: injectorLabels[item.normalizedName] ?? item.normalizedName.replace(/-injector$/, "").split("-").map((word) => word.toUpperCase() === "sj" ? "SJ" : word[0]?.toUpperCase() + word.slice(1)).join(" "),
  normalizedName: item.normalizedName,
  icon: `/images/injectors/${item.id}.webp`,
  wikiLink: item.wikiLink,
  useTime: item.properties?.useTime ?? 2,
  cures: item.properties?.cures ?? [],
  effects: item.properties?.stimEffects ?? [],
}));
await writeFile(path.join(questsOutput, "..", "injectors.json"), `${JSON.stringify(injectorPayload)}\n`, "utf8");
const ammo = Object.values(items).filter((item) => item.properties?.propertiesType === "ItemPropertiesAmmo" && item.properties?.ammoType === "bullet");
const ammoPayload = ammo.map((item) => ({ id: item.id, name: item.normalizedName, icon: `/images/ammo/${item.id}.webp`, wikiLink: item.wikiLink, caliber: item.properties.caliber, damage: item.properties.damage, armorDamage: item.properties.armorDamage, penetrationPower: item.properties.penetrationPower, penetrationChance: item.properties.penetrationChance, initialSpeed: item.properties.initialSpeed, ballisticCoefficient: item.properties.ballisticCoeficient, fragmentationChance: item.properties.fragmentationChance, accuracyModifier: item.properties.accuracyModifier, recoilModifier: item.properties.recoilModifier, heatFactor: item.properties.heatFactor, tracer: item.properties.tracer }));
await writeFile(path.join(questsOutput, "..", "ammo.json"), `${JSON.stringify(ammoPayload)}\n`, "utf8");
const itemAssetsManifest = path.join(root, "apps/desktop/public/item-assets-manifest.json");
const itemSourceUpdated = (await stat(itemsSource)).mtimeMs;
const itemImagesUpdated = (await stat(injectorIconsSource)).mtimeMs;
const currentItemImageCount = (await readdir(itemIconsOutput)).filter((name) => name.endsWith(".webp")).length;
let shouldCopyItemIcons = true;
try {
  const manifest = JSON.parse(await readFile(itemAssetsManifest, "utf8"));
  shouldCopyItemIcons = manifest.itemSourceUpdated !== itemSourceUpdated || manifest.itemImagesUpdated !== itemImagesUpdated || manifest.imageCount !== currentItemImageCount;
} catch { /* First build or missing manifest: copy the offline images. */ }
await Promise.all([
  writeFile(path.join(output, "regular.json"), `${JSON.stringify({ data: { maps: compactMaps } })}\n`, "utf8"),
  writeFile(path.join(output, "catalog.json"), `${JSON.stringify(catalogWithViewBoxes)}\n`, "utf8"),
  cp(path.join(source, "svg"), path.join(output, "svg"), { recursive: true, force: true }),
  cp(questsSource, path.join(questsOutput, "quests.en.json")),
  cp(questConditionsSource, path.join(questsOutput, "quest-conditions.source.json")),
  ...(hasTraderImages ? [cp(traderImagesSource, traderImagesOutput, { recursive: true, force: true })] : []),
  ...(shouldCopyItemIcons ? itemPayload.map((item) => cp(path.join(injectorIconsSource, `${item.id}.webp`), path.join(itemIconsOutput, `${item.id}.webp`)).catch(() => {})) : []),
  ...injectors.map((item) => cp(path.join(injectorIconsSource, `${item.id}.webp`), path.join(injectorIconsOutput, `${item.id}.webp`)).catch(() => {})),
  ...ammo.map((item) => cp(path.join(injectorIconsSource, `${item.id}.webp`), path.join(ballisticIconsOutput, `${item.id}.webp`)).catch(() => {})),
]);
const copiedItemImageCount = (await readdir(itemIconsOutput)).filter((name) => name.endsWith(".webp")).length;
await writeFile(itemAssetsManifest, `${JSON.stringify({ itemSourceUpdated, itemImagesUpdated, imageCount: copiedItemImageCount })}\n`, "utf8");
