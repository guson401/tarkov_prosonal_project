import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const questsPath = path.join(root, "resources/quests/quests.en.json");
const headers = { "user-agent": "TarkovCompanion/0.1 (quest title source reconciliation)" };

async function getJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

function normalizeTitle(title) {
  return title.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function addUnique(map, key, value) {
  if (!key || !value) return;
  const existing = map.get(key);
  if (existing === undefined) map.set(key, value);
  else if (existing !== value) map.set(key, null);
}

const [base, english, korean] = await Promise.all(
  ["tasks", "tasks_en", "tasks_ko"].map((name) =>
    getJson(`https://json.tarkov.dev/regular/${name}`),
  ),
);

const officialTitles = new Map();
for (const task of Object.values(base.data?.tasks ?? {})) {
  const englishTitle = english.data?.[task.name] ?? "";
  const koreanTitle = korean.data?.[task.name] ?? "";
  if (!englishTitle || !koreanTitle || englishTitle === koreanTitle) continue;
  addUnique(officialTitles, normalizeTitle(englishTitle), koreanTitle);
}

const wikiTitles = new Map();
let continuation;
do {
  const url = new URL("https://escapefromtarkov.fandom.com/ko/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "categorymembers");
  url.searchParams.set("cmtitle", "Category:Quests");
  url.searchParams.set("cmlimit", "500");
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(continuation ?? {})) url.searchParams.set(key, value);

  const result = await getJson(url);
  for (const page of result.query?.categorymembers ?? []) {
    // Korean Fandom quest titles use “Korean title (English title)”.
    const openParen = page.title.lastIndexOf("(");
    if (openParen <= 0 || !page.title.endsWith(")")) continue;
    const englishTitle = page.title.slice(openParen + 1, -1).trim();
    const koreanTitle = page.title.slice(0, openParen).trim();
    addUnique(wikiTitles, normalizeTitle(englishTitle), koreanTitle);
  }
  continuation = result.continue;
} while (continuation);

const data = JSON.parse(await readFile(questsPath, "utf8"));
const counts = { official: 0, wiki: 0, preserved: 0, missing: 0, ambiguous: 0 };

for (const quest of data.quests) {
  const key = normalizeTitle(quest.title ?? "");
  const officialTitle = officialTitles.get(key);
  const wikiTitle = wikiTitles.get(key);

  if (officialTitle === null || wikiTitle === null) counts.ambiguous++;
  if (officialTitle) {
    quest.titleKo = officialTitle;
    quest.titleKoSource = "official_in_game_localization";
    quest.titleKoSourceUrl = "https://tarkov.dev/api";
    counts.official++;
  } else if (wikiTitle) {
    quest.titleKo = wikiTitle;
    quest.titleKoSource = "korean_fandom_wiki";
    quest.titleKoSourceUrl = "https://escapefromtarkov.fandom.com/ko/wiki/Escape_from_Tarkov_Wiki";
    counts.wiki++;
  } else if (quest.titleKo) {
    quest.titleKoSource = "existing_fallback_unmatched";
    delete quest.titleKoSourceUrl;
    counts.preserved++;
  } else {
    delete quest.titleKoSource;
    delete quest.titleKoSourceUrl;
    counts.missing++;
  }
}

await writeFile(questsPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...counts, total: data.quests.length }, null, 2));
