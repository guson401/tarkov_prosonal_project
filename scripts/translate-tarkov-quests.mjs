import { readFile, rename, unlink, writeFile } from "node:fs/promises";

const file = "resources/quests/quests.en.json";
const temp = file + ".tmp";
const cacheFile = "resources/quests/quests.translation-cache.json";
const cacheTemp = cacheFile + ".tmp";
const apiKey = process.env.TARKOV_GOOGLE_TRANSLATE_API_KEY;
if (!apiKey) throw new Error("Set TARKOV_GOOGLE_TRANSLATE_API_KEY before running this script. The key is read from the environment and is not written to disk.");
const endpoint = "https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(apiKey);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const terms = [
  ["Streets of Tarkov", "타르코프 시내"], ["Ground Zero", "그라운드 제로"], ["The Lab", "연구소"],
  ["BTR Driver", "BTR 운전기사"], ["Lightkeeper", "라이트키퍼"], ["Peacekeeper", "피스키퍼"],
  ["Interchange", "인터체인지"], ["Shoreline", "해안선"], ["Lighthouse", "등대"], ["Customs", "세관"],
  ["Woods", "삼림"], ["Factory", "공장"], ["Reserve", "리저브"], ["Labyrinth", "미궁"],
  ["Prapor", "프라포르"], ["Therapist", "테라피스트"], ["Mechanic", "메카닉"], ["Ragman", "래그맨"],
  ["Jaeger", "예거"], ["Skier", "스키어"], ["Fence", "펜스"], ["Ref", "리플"],
  ["Scavs", "스캐브"], ["Scav", "스캐브"], ["Cultists", "광신도"], ["Cultist", "광신도"],
  ["Rogues", "로그"], ["Rogue", "로그"], ["Raiders", "레이더"], ["Raider", "레이더"],
  ["PMC", "PMC"], ["USEC", "USEC"], ["BEAR", "BEAR"], ["Found in raid", "레이드 내 획득"],
  ["Roubles", "루블"], ["Rouble", "루블"], ["EXP", "경험치"], ["signal flare", "신호탄"],
];
const headings = {
  Dialogue: "대화", Requirements: "요구 조건", Objectives: "목표", Rewards: "보상", Guide: "공략",
  "Failure Penalty": "실패 시 불이익", "Failure Dialogue": "실패 대사", Failure: "실패 조건",
  "Quest items": "퀘스트 아이템", "Quest Item": "퀘스트 아이템", "See also": "관련 문서",
  "Related quests": "관련 퀘스트", "Completion Dialogue": "완료 대사", "Quest description": "퀘스트 설명",
};

function gloss(text) {
  const replacements = [];
  for (let i = 0; i < terms.length; i++) {
    const [en, ko] = terms[i];
    const marker = "ZXTERM" + String(i).padStart(3, "0") + "ZX";
    const re = new RegExp("\\b" + en + "\\b", "gi");
    if (re.test(text)) {
      re.lastIndex = 0;
      text = text.replace(re, marker);
      replacements.push([marker, ko]);
    }
  }
  return { text, replacements };
}

function splitText(text, max = 2100) {
  if (text.length <= max) return [text];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out = [];
  let chunk = "";
  for (const sentence of sentences) {
    if (sentence.length > max) {
      if (chunk) out.push(chunk);
      chunk = "";
      for (let i = 0; i < sentence.length; i += max) out.push(sentence.slice(i, i + max));
    } else if (chunk && chunk.length + sentence.length + 1 > max) {
      out.push(chunk);
      chunk = sentence;
    } else chunk += (chunk ? " " : "") + sentence;
  }
  if (chunk) out.push(chunk);
  return out;
}

async function translate(batch) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: batch.map((x) => x.text), source: "en", target: "ko", format: "text" }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw new Error("Translation service returned " + r.status);
      const json = await r.json();
      const outputs = json.data?.translations ?? [];
      if (outputs.length !== batch.length) throw new Error("Translation count mismatch");
      return batch.map((entry, i) => {
        let text = outputs[i].translatedText ?? "";
        for (const [key, value] of entry.replacements) text = text.replaceAll(key, value);
        return [entry.id, text];
      });
    } catch (error) {
      console.warn("Translation request retry " + (attempt + 1) + ": " + error.message);
      if (attempt === 5) throw error;
      await wait(attempt === 0 ? 15000 : Math.min(15000 * (2 ** (attempt - 1)), 60000));
    }
  }
  return [];
}

const data = JSON.parse(await readFile(file, "utf8"));
const jobs = [];
let id = 0;
for (const quest of data.quests) {
  const matches = [...quest.content.matchAll(/^==\s*(.*?)\s*==\s*$/gm)];
  quest.sectionsKo = [];
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1];
    let body = quest.content.slice(matches[i].index + matches[i][0].length, matches[i + 1]?.index ?? quest.content.length).trim();
    const gameText = title === "Objectives" && quest.objectivesKo?.length;
    if (gameText) {
      quest.sectionsKo.push({ title, titleKo: headings[title] ?? title, segmentIds: [], text: quest.objectivesKo.join("\n"), gameText: true });
      continue;
    }
    const ids = [];
    for (const part of splitText(body)) {
      const protectedText = gloss(part);
      jobs.push({ id, text: protectedText.text, replacements: protectedText.replacements });
      ids.push(id++);
    }
    quest.sectionsKo.push({ title, titleKo: headings[title] ?? title, segmentIds: ids, gameText: false });
  }
}

const batches = [];
let current = [];
let chars = 0;
for (const job of jobs) {
  if (current.length && chars + job.text.length + 25 > 3400) {
    batches.push(current);
    current = [];
    chars = 0;
  }
  current.push(job);
  chars += job.text.length + 25;
}
if (current.length) batches.push(current);

let cache = { sourceFetchedAt: data.fetchedAt, translated: {} };
try { cache = JSON.parse(await readFile(cacheFile, "utf8")); } catch { /* no previous checkpoint */ }
if (cache.sourceFetchedAt !== data.fetchedAt) cache = { sourceFetchedAt: data.fetchedAt, translated: {} };
const translated = new Map(Object.entries(cache.translated ?? {}).map(([key, value]) => [Number(key), value]));
console.log("Prepared " + jobs.length + " chunks in " + batches.length + " request batches; resuming at " + translated.size + " saved chunks.");
let saveQueue = Promise.resolve();
const saveCache = () => {
  const snapshot = { sourceFetchedAt: data.fetchedAt, translated: Object.fromEntries(translated) };
  saveQueue = saveQueue.then(async () => {
    await writeFile(cacheTemp, JSON.stringify(snapshot), "utf8");
    await rename(cacheTemp, cacheFile);
  });
  return saveQueue;
};
let cursor = 0;
const worker = async () => {
  while (cursor < batches.length) {
    const index = cursor++;
    const remaining = batches[index].filter((entry) => !translated.has(entry.id));
    if (remaining.length) {
      for (const [key, value] of await translate(remaining)) translated.set(key, value);
      await saveCache();
    }
    if ((index + 1) % 25 === 0 || index + 1 === batches.length) console.log("Translated " + (index + 1) + "/" + batches.length + " batches; " + translated.size + "/" + jobs.length + " chunks saved");
    await wait(1000);
  }
};
await Promise.all(Array.from({ length: 2 }, worker));
await saveQueue;

if (translated.size !== jobs.length) {
  throw new Error(`Translation incomplete: ${translated.size}/${jobs.length} chunks saved. The source file was not replaced; rerun to resume from the cache.`);
}

for (const quest of data.quests) {
  quest.sectionsKo = quest.sectionsKo.map((section) => ({
    title: section.title,
    titleKo: section.titleKo,
    text: section.gameText ? section.text : section.segmentIds.map((key) => translated.get(key) || "").filter(Boolean).join("\n\n"),
    translationSource: section.gameText ? "Tarkov.dev game localization" : "English wiki source translation",
  }));
  const objectives = quest.sectionsKo.find((section) => section.title === "Objectives");
  if (objectives) quest.objectivesKo = objectives.text.split("\n").map((line) => line.trim()).filter(Boolean);
}
data.contentTranslation = "English wiki text translated into Korean using Google Cloud Translation and a Tarkov terminology glossary. Original English content is retained.";
data.contentTranslationUrl = "https://cloud.google.com/translate/pricing";
data.contentTranslatedAt = new Date().toISOString();
await writeFile(temp, JSON.stringify(data, null, 2) + "\n", "utf8");
await rename(temp, file);
await unlink(cacheFile).catch(() => {});
console.log("Saved translated content for " + data.quests.length + " quests (" + jobs.length + " chunks, " + batches.length + " requests).");
