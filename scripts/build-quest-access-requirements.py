import json
import urllib.parse
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRADERS = {
    "54cb50c76803fa8b248b4571": "Prapor",
    "54cb57776803fa99248b456e": "Therapist",
    "579dc571d53a0658a154fbec": "Fence",
    "58330581ace78e27b8b10cee": "Skier",
    "5935c25fb3acc3127c3d8cd9": "Peacekeeper",
    "5a7c2eca46aef81a7ca2145d": "Mechanic",
    "5ac3b934156ae10c4430e83c": "Ragman",
    "5c0647fdd443bc2504c2d371": "Jaeger",
    "6617beeaa9cfa777ca915b7c": "Ref",
}

modes = {}
mode_pages = {}
task_count = {}
for mode in ("pve", "pvp"):
    tasks = json.loads((ROOT / f"resources/quests/tasks.{mode}.json").read_text(encoding="utf-8"))["data"]["tasks"]
    records = {}
    pages = set()
    task_by_id = tasks
    for task in tasks.values():
        page = urllib.parse.unquote(urllib.parse.urlparse(task.get("wikiLink", "")).path).split("/")[-1].lower()
        pages.add(page)
        requirements = [
            {
                "trader": TRADERS[item["trader"]],
                "type": item.get("requirementType"),
                "compare": item.get("compareMethod", ">="),
                "value": item.get("value", 0),
            }
            for item in task.get("traderRequirements", [])
            if item.get("trader") in TRADERS
        ]
        task_requirements = []
        for item in task.get("taskRequirements", []):
            parent = task_by_id.get(item.get("task"), {})
            parent_page = urllib.parse.unquote(urllib.parse.urlparse(parent.get("wikiLink", "")).path).split("/")[-1].lower()
            task_requirements.append({
                "page": parent_page,
                "title": parent.get("normalizedName") or parent.get("name") or parent_page,
                "statuses": item.get("status", []),
            })
        player_level = task.get("minPlayerLevel", 0)
        records.setdefault(page, []).append({"playerLevel": player_level if player_level > 1 else 0, "traderRequirements": requirements, "taskRequirements": task_requirements})
    for page, variants in records.items():
        records[page] = list({json.dumps(variant, sort_keys=True): variant for variant in variants}.values())
    modes[mode] = records
    mode_pages[mode] = pages
    task_count[mode] = sum(bool(task.get("taskRequirements")) for task in tasks.values())

payload = {
    "source": "Tarkov.dev mode-specific task data",
    "sourceUrls": ["https://json.tarkov.dev/pve/tasks", "https://json.tarkov.dev/regular/tasks"],
    "fetchedAt": date.today().isoformat(),
    "modes": modes,
}
(ROOT / "resources/quests/quest-access-requirements.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(f"Saved quest access requirements: PvE={len(modes['pve'])}, PvP={len(modes['pvp'])}")
print(f"Saved task prerequisite source rows: PvE={task_count['pve']}, PvP={task_count['pvp']}")

availability = {
    "source": "Tarkov.dev mode-specific task datasets",
    "sourceUrls": ["https://json.tarkov.dev/pve/tasks", "https://json.tarkov.dev/regular/tasks"],
    "fetchedAt": date.today().isoformat(),
    "pveOnly": sorted(mode_pages["pve"] - mode_pages["pvp"]),
    "pvpOnly": sorted(mode_pages["pvp"] - mode_pages["pve"]),
}
(ROOT / "resources/quests/quest-mode-availability.json").write_text(
    json.dumps(availability, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(f"Saved mode availability: PvE-only={len(availability['pveOnly'])}, PvP-only={len(availability['pvpOnly'])}")
