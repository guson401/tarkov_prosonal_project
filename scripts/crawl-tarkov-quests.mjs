import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const api = "https://escapefromtarkov.fandom.com/api.php";
const headers = { "User-Agent": "TarkovCompanion/0.1 (quest reference; local desktop app)" };
const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

async function get(params) {
  const url = new URL(api);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Wiki API returned ${response.status}: ${url}`);
  return response.json();
}

function infoboxValue(wikitext, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = wikitext.match(new RegExp(`^\\|[ \\t]*${escaped}[ \\t]*=[ \\t]*([^\\r\\n]*)`, "im"));
  return match ? cleanInline(match[1]) : "";
}

function removeTemplates(text) {
  let output = "";
  for (let index = 0; index < text.length;) {
    if (text.startsWith("{{", index)) {
      let depth = 1;
      index += 2;
      while (index < text.length && depth) {
        if (text.startsWith("{{", index)) { depth++; index += 2; }
        else if (text.startsWith("}}", index)) { depth--; index += 2; }
        else index++;
      }
    } else {
      output += text[index++];
    }
  }
  return output;
}

function cleanInline(value) {
  return value
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/'{2,}/g, "")
    .replace(/\[\[Category:[^\]]+\]\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanWikiText(wikitext, title) {
  return removeTemplates(wikitext.replace(/<!--.*?-->/gs, "").replace(/\{\{PAGENAME\}\}/g, title).replace(/\{\{quote\|([^{}]*)\}\}/g, "$1"))
    .replace(/\[\[(?:File|Image):[^\]]+\]\]/gi, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[https?:\/\/[^ ]+ ([^\]]+)\]/g, "$1")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>|<ref\b[^>]*\/>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/'{2,}/g, "")
    .replace(/^\s*[{|!].*$/gm, "")
    .replace(/^\s*\|.*$/gm, "")
    .replace(/^File:[^\n|]+\|([^\n]+)$/gm, "$1")
    .replace(/^File:[^\n]+$/gm, "")
    .replace(/^Category:.*$/gm, "")
    .replace(/^(?:[a-z]{2}(?:-[a-z]{2})?):[^\n]*$/gim, "")
    .replace(/^\s*\*+\s?/gm, "")
    .replace(/^\s*#+\s?/gm, "")
    .replace(/^[ \t]*=+[ \t]*(.*?)[ \t]*=+[ \t]*$/gm, "== $1 ==")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeQuestTitle(title) {
  return title.normalize("NFKD").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

async function getGameLocalizations() {
  try {
    const [base, english, korean] = await Promise.all(["tasks", "tasks_en", "tasks_ko"].map(async (name) => {
      const response = await fetch(`https://json.tarkov.dev/regular/${name}`, { headers });
      if (!response.ok) throw new Error(`Tarkov.dev ${name} returned ${response.status}`);
      return response.json();
    }));
    const titles = new Map();
    for (const task of Object.values(base.data?.tasks ?? {})) {
      const nameEn = english.data?.[task.name] ?? "";
      const nameKo = korean.data?.[task.name] ?? "";
      if (!nameEn) continue;
      titles.set(normalizeQuestTitle(nameEn), {
        titleKo: nameKo && nameKo !== nameEn ? nameKo : "",
        objectivesEn: (task.objectives ?? []).map((objective) => english.data?.[objective.description] ?? ""),
        objectivesKo: (task.objectives ?? []).map((objective) => korean.data?.[objective.description] ?? ""),
      });
    }
    return titles;
  } catch (error) {
    console.warn("Could not load Tarkov.dev Korean game strings:", error);
    return new Map();
  }
}

const pages = [];
let continuation;
do {
  const result = await get({
    action: "query",
    list: "categorymembers",
    cmtitle: "Category:Quests",
    cmlimit: "500",
    format: "json",
    ...(continuation ?? {}),
  });
  pages.push(...(result.query?.categorymembers ?? []));
  continuation = result.continue;
} while (continuation);

const records = [];
const gameLocalizations = await getGameLocalizations();
for (let offset = 0; offset < pages.length; offset += 20) {
  const batch = pages.slice(offset, offset + 20);
  const result = await get({
    action: "query",
    pageids: batch.map(({ pageid }) => pageid).join("|"),
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    format: "json",
  });
  for (const page of Object.values(result.query?.pages ?? {})) {
    const wikitext = page.revisions?.[0]?.slots?.main?.["*"] ?? "";
    if (!wikitext) continue;
    const gameLocalization = gameLocalizations.get(normalizeQuestTitle(page.title)) ?? {};
    const content = cleanWikiText(wikitext, page.title);
    const wikiObjectives = content.match(/^== Objectives ==\n([\s\S]*?)(?=\n== |$)/m)?.[1]?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
    const hasFullGameTranslation = gameLocalization.objectivesKo?.length > 0
      && gameLocalization.objectivesKo.every((line, index) => line && line !== gameLocalization.objectivesEn[index]);
    const sameObjectiveSource = hasFullGameTranslation
      && gameLocalization.objectivesEn?.length === wikiObjectives.length
      && gameLocalization.objectivesEn.every((objective, index) => normalizeQuestTitle(objective) === normalizeQuestTitle(wikiObjectives[index]));
    records.push({
      id: page.pageid,
      title: page.title,
      url: `https://escapefromtarkov.fandom.com/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
      trader: infoboxValue(wikitext, "given by"),
      map: infoboxValue(wikitext, "location"),
      prerequisites: infoboxValue(wikitext, "previous"),
      unlocks: infoboxValue(wikitext, "leads to"),
      kappa: /\|\s*(?:reqkappa|kappa)\s*=\s*(?:<font[^>]*>\s*)?(?:''')?yes/i.test(wikitext),
      titleKo: gameLocalization.titleKo ?? "",
      objectivesKo: sameObjectiveSource ? gameLocalization.objectivesKo ?? [] : [],
      content,
    });
  }
  if (offset + 20 < pages.length) await sleep(350);
}

const output = {
  source: "The Official Escape from Tarkov Wiki (English, Fandom)",
  sourceUrl: "https://escapefromtarkov.fandom.com/wiki/Category:Quests",
  terminologySource: "Tarkov.dev Korean game task strings, matched by English quest name. Wiki facts and guides remain sourced from the English wiki.",
  terminologySourceUrl: "https://tarkov.dev/api",
  license: "CC BY-NC-SA 3.0",
  licenseUrl: "https://escapefromtarkov.fandom.com/wiki/Escape_from_Tarkov_Wiki:Copyrights",
  attribution: "Quest text is from The Official Escape from Tarkov Wiki and its contributors. See each quest's source link.",
  fetchedAt: new Date().toISOString(),
    quests: records.filter((quest) => quest.content.trim() && quest.title !== "Quests").sort((a, b) => a.title.localeCompare(b.title)),
};

const outputPath = resolve("resources/quests/quests.en.json");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Saved ${records.length} quest pages to ${outputPath}`);
