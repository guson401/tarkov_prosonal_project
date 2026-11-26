import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const api = "https://escapefromtarkov.fandom.com/api.php";
const userAgent = "TarkovCompanion/0.1 (quest reference; local desktop app)";
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const questsPath = resolve("resources/quests/quests.en.json");
const conditionsPath = resolve("resources/quests/quest-conditions.source.json");
const retiredPath = resolve("resources/quests/retired-quests.json");
const questsPayload = JSON.parse(await readFile(questsPath, "utf8"));
const conditionsPayload = JSON.parse(await readFile(conditionsPath, "utf8"));
const retired = [];

for (let offset = 0; offset < questsPayload.quests.length; offset += 20) {
  const batch = questsPayload.quests.slice(offset, offset + 20);
  const url = new URL(api);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", batch.map((quest) => quest.title).join("|"));
  url.searchParams.set("prop", "categories");
  url.searchParams.set("cllimit", "max");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");
  const response = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (!response.ok) throw new Error(`Wiki API returned ${response.status}: ${url}`);
  const result = await response.json();
  for (const page of Object.values(result.query?.pages ?? {})) {
    if (!(page.categories ?? []).some((category) => category.title === "Category:Historical content")) continue;
    const record = batch.find((quest) => quest.title.toLowerCase() === page.title.toLowerCase());
    if (record) retired.push({ id: record.id, title: record.title, url: record.url, wikiNotice: "This page describes content that was removed or replaced." });
  }
  if (offset + 20 < questsPayload.quests.length) await sleep(350);
}

if (retired.length === 0) throw new Error("No retired pages were confirmed; quest database was left unchanged.");
const retiredIds = new Set(retired.map((quest) => quest.id));
questsPayload.quests = questsPayload.quests.filter((quest) => !retiredIds.has(quest.id));
conditionsPayload.quests = conditionsPayload.quests.filter((quest) => !retiredIds.has(quest.id));
await Promise.all([
  writeFile(questsPath, `${JSON.stringify(questsPayload, null, 2)}\n`, "utf8"),
  writeFile(conditionsPath, `${JSON.stringify(conditionsPayload, null, 2)}\n`, "utf8"),
  writeFile(retiredPath, `${JSON.stringify({ source: "The Official Escape from Tarkov Wiki (English, Fandom)", removedAt: new Date().toISOString(), quests: retired }, null, 2)}\n`, "utf8"),
]);
console.log(`Removed ${retired.length} quests marked removed or replaced.`);
for (const quest of retired) console.log(`${quest.id}\t${quest.title}`);
