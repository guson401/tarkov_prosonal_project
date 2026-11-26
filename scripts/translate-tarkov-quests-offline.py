import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / ".translation-runtime"))
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

torch.set_num_threads(max(1, (os.cpu_count() or 2) // 2))
MODEL_NAME = "facebook/nllb-200-distilled-600M"
TOKENIZER = AutoTokenizer.from_pretrained(MODEL_NAME, local_files_only=True)
TOKENIZER.src_lang = "eng_Latn"
MODEL = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, local_files_only=True)
MODEL.eval()
TARGET_TOKEN = TOKENIZER.convert_tokens_to_ids("kor_Hang")

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "resources/quests/quests.en.json"
CACHE_PATH = ROOT / "resources/quests/quests.argos-cache.json"

TRADERS = {
    "Prapor": "프라포르", "Therapist": "테라피스트", "Mechanic": "정비사",
    "Ragman": "레그맨", "Jaeger": "예거", "Skier": "스키어",
    "Fence": "펜스", "Peacekeeper": "피스키퍼", "Lightkeeper": "라이트키퍼",
    "Ref": "레프", "BTR Driver": "BTR 운전기사",
}
MAPS = {
    "Streets of Tarkov": "타르코프 시내", "Ground Zero": "그라운드 제로",
    "The Lab": "연구소", "Labyrinth": "미궁", "Interchange": "인터체인지",
    "Shoreline": "쇼어라인", "Lighthouse": "라이트하우스", "Customs": "커스텀",
    "Woods": "우즈", "Factory": "팩토리", "Reserve": "리저브",
}
TERMS = {
    **TRADERS, **MAPS,
    "Escape from Tarkov": "Escape from Tarkov", "TerraGroup Labs": "테라그룹 연구소",
    "TerraGroup": "테라그룹", "USEC": "USEC", "BEAR": "BEAR", "PMC": "PMC",
    "BTR": "BTR", "Scav Raiders": "스캐브 레이더", "Scav": "스캐브", "Scavs": "스캐브",
    "Rogues": "로그", "Rogue": "로그", "Cultists": "광신도", "Cultist": "광신도",
    "Raiders": "레이더", "Raider": "레이더", "Black Division": "블랙 디비전",
    "Loyalty Level": "상인 평판 등급", "Intelligence Center": "정보 센터",
    "Kappa": "카파", "Roubles": "루블", "Rouble": "루블", "Ragman Rep": "레그맨 평판",
    "Therapist Rep": "테라피스트 평판", "Prapor Rep": "프라포르 평판",
    "Skier Rep": "스키어 평판", "Peacekeeper Rep": "피스키퍼 평판",
    "Mechanic Rep": "정비사 평판", "Jaeger Rep": "예거 평판", "Fence Rep": "펜스 평판",
    "Tarkovskaya vodka": "타르코프스카야 보드카",
    "Fierce Hatchling moonshine": "피어스 해츨링 문샤인",
    "Bottle of Fierce Hatchling moonshine": "피어스 해츨링 문샤인",
    "Dan Jackiel whiskey": "댄 재키얼 위스키", "Rye croutons": "라이 크루통",
    "Salty Dog beef sausages": "솔티 독 비프 소시지",
    "MS2000 Marker": "MS2000 마커", "Golden Star balm": "골든 스타 밤",
    "AHF1-M": "AHF1-M", "3-(b-TG)": "3-(b-TG)", "M.U.L.E.": "M.U.L.E.",
    "SJ1 TGLabs": "SJ1 TGLabs", "SJ6 TGLabs": "SJ6 TGLabs", "eTG-change": "eTG-체인지",
    "ORSIS T-5000M": "ORSIS T-5000M", "AXMC": "AXMC", "AK-74": "AK-74",
    "AK-12": "AK-12", "RPK-16": "RPK-16", "M4A1": "M4A1", "ADAR 2-15": "ADAR 2-15",
    "TerraGroup Labs access keycard": "테라그룹 연구소 출입 카드",
    "TerraGroup Labs keycard": "테라그룹 연구소 출입 카드",
}
HEADINGS = {
    "Dialogue": "대화", "Requirements": "요구 조건", "Objectives": "목표",
    "Rewards": "보상", "Guide": "공략", "Failure Penalty": "실패 시 불이익",
    "Failure Dialogue": "실패 대사", "Completion Dialogue": "완료 대사",
    "Quest items": "퀘스트 아이템", "Quest Item": "퀘스트 아이템",
    "See also": "관련 문서", "Related quests": "관련 퀘스트",
    "Initial Equipment": "초기 장비", "Trivia": "참고", "Riddle": "수수께끼",
    "Old description": "이전 설명", "Old reward text": "이전 보상 문구",
    "Quest description decryption": "퀘스트 설명 해독", "Quest reward text decryption": "퀘스트 보상 문구 해독",
    "Piecing everything together": "단서 조합", "The pastebin": "페이스트빈",
    "Finale": "마무리",
}

def korean_trader(value):
    value = value.strip().rstrip(".")
    return re.sub(r"BTR Driver|Peacekeeper|Therapist|Mechanic|Lightkeeper|Prapor|Ragman|Jaeger|Skier|Fence|Ref",
                  lambda m: TRADERS[m.group(0)], value)

def translate_requirement(line, quest_titles):
    s = line.strip().rstrip(".")
    m = re.fullmatch(r"Reach Loyalty Level (\d+) with (.+)", s, re.I)
    if m:
        level, names = m.groups()
        return f"{korean_trader(names)} 상인 평판 등급 {level} 달성"
    m = re.fullmatch(r"Reach ([+-]?\d+(?:\.\d+)?) reputation with (.+)", s, re.I)
    if m:
        amount, trader = m.groups()
        return f"{korean_trader(trader)} 평판 {amount} 이상 달성"
    m = re.fullmatch(r"Have less than ([+-]?\d+(?:\.\d+)?) reputation with (.+)", s, re.I)
    if m:
        amount, trader = m.groups()
        return f"{korean_trader(trader)} 평판 {amount} 미만 유지"
    m = re.fullmatch(r"Must be level (\d+) to start this quest", s, re.I)
    if m:
        return f"이 퀘스트를 시작하려면 PMC 레벨 {m.group(1)} 이상이어야 합니다."
    if re.fullmatch(r"Must be playing in the Seasonal mode", s, re.I):
        return "시즌 모드로 플레이 중이어야 합니다."
    m = re.fullmatch(r"This quest is only obtainable by (USEC|BEAR) PMCs", s, re.I)
    if m:
        return f"{m.group(1).upper()} PMC만 수락할 수 있습니다."
    m = re.fullmatch(r"This quest is only available to buyers of the ['\"](.+?)['\"] edition of the game", s, re.I)
    if m:
        return f"게임의 {m.group(1)} 에디션 구매자만 수락할 수 있습니다."
    m = re.fullmatch(r"Scav karma of at least ([+-]?\d+(?:\.\d+)?)", s, re.I)
    if m:
        return f"스캐브 카르마 {m.group(1)} 이상"
    m = re.fullmatch(r"Scav karma of (-\d+(?:\.\d+)?)", s, re.I)
    if m:
        return f"스캐브 카르마 {m.group(1)}"
    m = re.fullmatch(r"Reach ([+-]?\d+(?:\.\d+)?) standing with Fence", s, re.I)
    if m:
        return f"펜스 평판 {m.group(1)} 이상 달성"
    m = re.fullmatch(r"Must accept (.+?) to obtain this quest", s, re.I)
    if m:
        raw = m.group(1)
        trader, _, title = raw.partition("'s quest ")
        if title:
            return f"이 퀘스트를 받으려면 {TRADERS.get(trader, trader)}의 ‘{quest_titles.get(title, title)}’ 퀘스트를 수락해야 합니다."
    m = re.fullmatch(r"Complete (.+)", s, re.I)
    if m:
        title = m.group(1).strip()
        if title.endswith(":"):
            return "다음 퀘스트 완료:"
        return f"‘{quest_titles.get(title, title)}’ 퀘스트 완료"
    m = re.fullmatch(r"Unlocks (\d+ hours?|\d+ minutes?) after completion of (.+)", s, re.I)
    if m:
        return f"‘{quest_titles.get(m.group(2), m.group(2))}’ 퀘스트 완료 후 {m.group(1)} 뒤 해금"
    return translate_text(line)

def translate_text(text):
    if not text.strip():
        return text
    replacements = {}
    protected = text
    for i, (source, target) in enumerate(sorted(TERMS.items(), key=lambda x: len(x[0]), reverse=True)):
        pattern = re.compile(r"(?<![A-Za-z0-9])" + re.escape(source) + r"(?![A-Za-z0-9])", re.I)
        token = f"ZXTERM{i:03d}XZ"
        protected, n = pattern.subn(token, protected)
        if n:
            replacements[token] = target
    # Translate in bounded blocks while retaining paragraph and list line breaks.
    output = []
    lines = protected.split("\n")
    block = []
    size = 0
    def flush():
        nonlocal block, size
        if not block:
            return
        value = "\n".join(block)
        try:
            encoded = TOKENIZER(value, return_tensors="pt", truncation=True, max_length=512)
            generated = MODEL.generate(**encoded, forced_bos_token_id=TARGET_TOKEN, max_new_tokens=320)
            translated = TOKENIZER.batch_decode(generated, skip_special_tokens=True)[0]
        except Exception:
            translated = value
        output.append(translated)
        block, size = [], 0
    for line in lines:
        if len(line) > 1100:
            flush()
            pieces = re.split(r"(?<=[.!?])\s+", line)
            chunk = ""
            for piece in pieces:
                if chunk and len(chunk) + len(piece) + 1 > 900:
                    encoded = TOKENIZER(chunk, return_tensors="pt", truncation=True, max_length=512)
                    generated = MODEL.generate(**encoded, forced_bos_token_id=TARGET_TOKEN, max_new_tokens=320)
                    output.append(TOKENIZER.batch_decode(generated, skip_special_tokens=True)[0])
                    chunk = ""
                chunk += (" " if chunk else "") + piece
            if chunk:
                encoded = TOKENIZER(chunk, return_tensors="pt", truncation=True, max_length=512)
                generated = MODEL.generate(**encoded, forced_bos_token_id=TARGET_TOKEN, max_new_tokens=320)
                output.append(TOKENIZER.batch_decode(generated, skip_special_tokens=True)[0])
            output.append("\n")
        elif size + len(line) + 1 > 1100:
            flush()
            block.append(line)
            size = len(line)
        else:
            block.append(line)
            size += len(line) + 1
    flush()
    translated = "\n".join(output)
    for token, value in replacements.items():
        translated = re.sub(re.escape(token), lambda _: value, translated, flags=re.I)
    return translated

def translate_objective(line, quest_titles):
    s = line.strip()
    optional = ""
    if s.startswith("(Optional) "):
        optional, s = "(선택) ", s[len("(Optional) "):]
    if re.fullmatch(r"Survive and extract from (.+)", s, re.I):
        loc = translate_text(re.fullmatch(r"Survive and extract from (.+)", s, re.I).group(1))
        return optional + f"{loc}에서 생존 후 탈출하기"
    m = re.fullmatch(r"Hand over (.+?) to (.+)", s, re.I)
    if m:
        item, recipient = m.groups()
        return optional + f"{translate_text(recipient)}에게 {translate_text(item)} 건네기"
    m = re.fullmatch(r"Hand over (.+)", s, re.I)
    if m:
        return optional + f"{translate_text(m.group(1))} 건네기"
    m = re.fullmatch(r"(Find|Locate and obtain|Locate|Obtain) (.+?) in raid", s, re.I)
    if m:
        verb, item = m.groups()
        action = "찾아 확보하기" if "obtain" in verb.lower() else "찾기"
        return optional + f"레이드에서 {translate_text(item)} {action}"
    m = re.fullmatch(r"(Find|Locate and obtain|Locate|Obtain) (.+)", s, re.I)
    if m:
        verb, item = m.groups()
        action = "찾아 확보하기" if "obtain" in verb.lower() else "찾기"
        return optional + f"{translate_text(item)} {action}"
    m = re.fullmatch(r"Complete (?:the task )?(.+)", s, re.I)
    if m:
        title = m.group(1).strip().rstrip(".")
        return optional + f"‘{quest_titles.get(title, title)}’ 퀘스트 완료하기"
    m = re.fullmatch(r"Report back to (.+)", s, re.I)
    if m:
        return optional + f"{translate_text(m.group(1))}에게 보고하기"
    return optional + translate_text(s)

data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
quest_titles = {q["title"]: q.get("titleKo", "") for q in data["quests"] if q.get("titleKo")}
cache = {"fetchedAt": data.get("fetchedAt"), "engine": MODEL_NAME, "quests": {}}
if CACHE_PATH.exists():
    try:
        old = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        if old.get("fetchedAt") == data.get("fetchedAt") and old.get("engine") == MODEL_NAME:
            cache["quests"] = old.get("quests", {})
    except Exception:
        pass

limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
pending = [q for q in data["quests"] if not q.get("sectionsKo") and str(q["id"]) not in cache["quests"]]
if limit:
    pending = pending[:limit]
print(f"Offline NLLB Translate: {len(pending)} quests queued; {len(cache['quests'])} checkpoints available; CPU threads limited to half.", flush=True)

for number, quest in enumerate(pending, 1):
    source_title = quest.get("title", "")
    title_ko = quest.get("titleKo") or translate_text(source_title)
    matches = list(re.finditer(r"^==\s*(.*?)\s*==\s*$", quest.get("content", ""), re.M))
    sections = []
    for i, match in enumerate(matches):
        title = match.group(1).strip()
        body = quest["content"][match.end():matches[i + 1].start() if i + 1 < len(matches) else len(quest["content"])].strip()
        if title == "Objectives" and quest.get("objectivesKo"):
            text = "\n".join(quest["objectivesKo"])
            source = "Tarkov.dev game localization"
        elif title == "Requirements":
            text = "\n".join(translate_requirement(line, quest_titles) for line in body.splitlines())
            source = "English wiki source translation"
        elif title == "Objectives":
            text = "\n".join(translate_objective(line, quest_titles) for line in body.splitlines())
            source = "English wiki source translation"
        else:
            text = translate_text(body)
            source = "English wiki source translation"
        sections.append({
            "title": title,
            "titleKo": HEADINGS.get(title, translate_text(title)),
            "text": text,
            "translationSource": source,
        })
    cache["quests"][str(quest["id"])] = {"titleKo": title_ko, "sectionsKo": sections}
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    if number % 10 == 0 or number == len(pending):
        print(f"Translated {number}/{len(pending)} queued quests; checkpointed {quest['id']} {source_title}", flush=True)

for quest in data["quests"]:
    translated = cache["quests"].get(str(quest["id"]))
    if not translated or quest.get("sectionsKo"):
        continue
    quest["titleKo"] = translated["titleKo"]
    quest["sectionsKo"] = translated["sectionsKo"]
    objectives = next((x for x in quest["sectionsKo"] if x["title"] == "Objectives"), None)
    if objectives:
        quest["objectivesKo"] = [line.strip() for line in objectives["text"].splitlines() if line.strip()]

if not limit and len([q for q in data["quests"] if q.get("sectionsKo")]) == len(data["quests"]):
    data["contentTranslation"] = "English wiki text translated into Korean with offline Argos Translate and a Tarkov terminology glossary. Original English content is retained."
    data["contentTranslationUrl"] = "https://github.com/argosopentech/argos-translate"
    data["contentTranslatedAt"] = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    CACHE_PATH.unlink(missing_ok=True)
    print(f"Saved translated content for all {len(data['quests'])} quests.", flush=True)
else:
    print(f"Checkpointed {len(cache['quests'])} of {len(data['quests'])} quests; source file not yet replaced.", flush=True)
