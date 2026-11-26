import { useEffect, useMemo, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { experienceRequiredForLevel, getPlayerExperienceProgress, MAX_PLAYER_EXPERIENCE, playerLevelForExperience } from "./player-levels";
import {
  Activity, Backpack, Bell, BookOpen, ChevronDown, Clock3, Crosshair, Eye, EyeOff, Home, Minus, Plus, Syringe, Target, PanelLeftClose, PanelLeftOpen,
  Map, MapPin, Search, Settings, Shield, UserRound, Users, Wallet,
} from "lucide-react";
import {
  getMapMarkerCategories, getMapMarkers, projectMapMarker, toMapOptions,
  type MapCatalogEntry, type MapMarker, type MarkerCategoryId, type MapOption, type TarkovMap,
} from "./map-data";
import "./maps.css";
import "./quests.css";
import "./quest-meta.css";
import "./profile.css";
import "./injectors.css";
import "./ballistics.css";
import "./items.css";
import "./quest-mode.css";
import { getSkillDetails, skillIconPath, skillWikiUrl } from "./skill-details";
import { storyChapterNotes, storyChapterWiki, ticketEndings, type TicketEnding } from "./story-details";
import traderLoyaltyWiki from "../../../resources/quests/trader-loyalty-wiki.json";
import questModeAvailability from "../../../resources/quests/quest-mode-availability.json";
import questAccessRequirements from "../../../resources/quests/quest-access-requirements.json";

type Tab = "홈" | "프로필" | "퀘스트" | "아이템" | "주사기" | "탄도학" | "맵" | "파티" | "스킬" | "설정";
type QuestRecord = { id: number; title: string; titleKo: string; objectivesKo: string[]; sectionsKo?: { title: string; titleKo: string; text: string; translationSource: string }[]; url: string; content: string; trader: string; map: string; prerequisites: string; wikiPrerequisites?: string; wikiRequirements?: string; unlocks: string; kappa: boolean };
type QuestPayload = { source: string; sourceUrl: string; terminologySource: string; terminologySourceUrl: string; license: string; licenseUrl: string; attribution: string; fetchedAt: string; contentTranslation?: string; contentTranslationUrl?: string; contentTranslatedAt?: string; quests: QuestRecord[] };
type GameMode = "PVP" | "PVE";
const questModePages = questModeAvailability as { pveOnly: string[]; pvpOnly: string[] };
type QuestAccessRequirement = { trader: string; type: "level" | "reputation"; compare: ">=" | ">" | "<=" | "<"; value: number };
type QuestAccessTaskRequirement = { page: string; title: string; statuses: string[] };
type QuestAccessVariant = { playerLevel: number; traderRequirements: QuestAccessRequirement[]; taskRequirements: QuestAccessTaskRequirement[] };
const questAccessData = questAccessRequirements as { modes: Record<"pve" | "pvp", Record<string, QuestAccessVariant[]>> };
function questWikiPage(quest: QuestRecord) {
  try { return decodeURIComponent(new URL(quest.url).pathname).split("/").pop()?.toLowerCase() ?? ""; } catch { return ""; }
}
function isQuestAvailableInMode(quest: QuestRecord, mode: GameMode) {
  const page = questWikiPage(quest);
  if (!page) return true;
  return mode === "PVE" ? !questModePages.pvpOnly.includes(page) : !questModePages.pveOnly.includes(page);
}
function questRequirementMet(actual: number, requirement: QuestAccessRequirement) {
  if (requirement.compare === ">=") return actual >= requirement.value;
  if (requirement.compare === ">") return actual > requirement.value;
  if (requirement.compare === "<=") return actual <= requirement.value;
  return actual < requirement.value;
}
function questPageKey(page: string) { return page.toLowerCase().replace(/[^a-z0-9]/g, ""); }
type PlayerProfile = { name: string; level: number; experience: number; prestige: number; traderRep: Record<string, number>; traderSales: Record<string, number>; skills: Record<string, number>; weaponMastery: Record<string, number>; prestigeMode: "PVP" | "PVE"; stashRoubles: number; hideout: Record<string, number>; prestigeChecks: Record<string, boolean> };
const skillCatalog: { id: string; name: string; category: string }[] = [
  ...["Endurance", "Health", "Immunity", "Metabolism", "Strength", "Stress Resistance", "Vitality"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Physical" })),
  ...["Aim Drills", "Assault Rifles", "Bolt-action Rifles", "DMRs", "Heavy Machine Guns", "Light Machine Guns", "Melee", "Pistols", "Revolvers", "Grenade Launchers", "Shotguns", "Submachine Guns", "Throwables", "Troubleshooting", "Underbarrel Launchers"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Combat" })),
  ...["Covert Movement", "Crafting", "Heavy Vests", "Hideout Management", "Light Vests", "Mag Drills", "Search", "Surgery", "Weapon Maintenance"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Practical" })),
  ...["Attention", "Charisma", "Intellect", "Perception"].map((name) => ({ id: name.toLowerCase(), name, category: "Mental" })),
  ...["Auctions", "Clean Operations", "Field Medicine", "First Aid", "Lockpicking", "Night Ops", "Shadow Connections", "Silent Ops", "Task Performance"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Other" })),
  ...["BEAR AK Systems", "BEAR Assault Operations", "BEAR Authority", "BEAR Heavy Caliber", "BEAR Raw Power"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Other" })),
];
const PROFILE_KEY = "fieldnote.profile";
const DEFAULT_PROFILE: PlayerProfile = { name: "SCAV-0412", level: 24, experience: experienceRequiredForLevel(24), prestige: 0, traderRep: {}, traderSales: {}, skills: Object.fromEntries(skillCatalog.map((skill) => [skill.id, 0])), weaponMastery: {}, prestigeMode: "PVE", stashRoubles: 0, hideout: {}, prestigeChecks: {} };

const navItems: { label: Tab; icon: typeof Home }[] = [
  { label: "홈", icon: Home },
  { label: "프로필", icon: UserRound },
  { label: "퀘스트", icon: Crosshair },
  { label: "아이템", icon: Backpack },
  { label: "주사기", icon: Syringe },
  { label: "탄도학", icon: Target },
  { label: "맵", icon: Map },
  { label: "스킬", icon: Activity },
  { label: "파티", icon: Users },
];
type QuestVisibility = "all" | "available";
const QUEST_VISIBILITY_KEY = "fieldnote.questVisibility";
const SHOW_COMPLETED_QUESTS_KEY = "fieldnote.showCompletedQuests";
const SHOW_PAST_EVENT_QUESTS_KEY = "fieldnote.showPastEventQuests";
const ACTIVE_QUESTS_KEY = "fieldnote.activeQuests";
const COMPLETED_QUEST_AT_KEY = "fieldnote.completedQuestAt";
const STORY_PROGRESS_KEY = "fieldnote.storyChapterProgress";
const STORY_ENDING_KEY = "fieldnote.storyEndingGoal";
type StoryProgress = Record<string, "not-started" | "active" | "completed">;

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("홈");
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}") as Partial<PlayerProfile>;
      const legacyLevel = Math.min(79, Math.max(1, Math.floor(saved.level ?? DEFAULT_PROFILE.level)));
      const experience = Math.min(MAX_PLAYER_EXPERIENCE, Math.max(0, Number.isFinite(saved.experience) ? saved.experience! : experienceRequiredForLevel(legacyLevel)));
      return { ...DEFAULT_PROFILE, ...saved, level: playerLevelForExperience(experience), experience, skills: { ...DEFAULT_PROFILE.skills, ...saved.skills }, weaponMastery: saved.weaponMastery ?? {}, traderRep: saved.traderRep ?? {}, traderSales: saved.traderSales ?? {}, hideout: saved.hideout ?? {}, prestigeChecks: saved.prestigeChecks ?? {} };
    }
    catch { return DEFAULT_PROFILE; }
  });
  const [completedQuests, setCompletedQuests] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("fieldnote.completedQuests") ?? "[]") as number[]); }
    catch { return new Set(); }
  });
  const [completedQuestAt, setCompletedQuestAt] = useState<Record<number, number>>(() => { try { return JSON.parse(localStorage.getItem(COMPLETED_QUEST_AT_KEY) ?? "{}"); } catch { return {}; } });
  const [activeQuests, setActiveQuests] = useState<Set<number>>(() => { try { return new Set(JSON.parse(localStorage.getItem(ACTIVE_QUESTS_KEY) ?? "[]") as number[]); } catch { return new Set(); } });
  const [failedQuests, setFailedQuests] = useState<Set<number>>(() => { try { return new Set(JSON.parse(localStorage.getItem("fieldnote.failedQuests") ?? "[]") as number[]); } catch { return new Set(); } });
  const updateQuestFailed = (questId: number) => { const next = new Set(failedQuests); if (next.has(questId)) next.delete(questId); else next.add(questId); setFailedQuests(next); localStorage.setItem("fieldnote.failedQuests", JSON.stringify([...next])); };
  const updateQuestActive = (questId: number, active: boolean) => { const next = new Set(activeQuests); if (active) next.add(questId); else next.delete(questId); setActiveQuests(next); localStorage.setItem(ACTIVE_QUESTS_KEY, JSON.stringify([...next])); };
  const [sqliteReady, setSqliteReady] = useState(false);
  const [questVisibility, setQuestVisibility] = useState<QuestVisibility>(() => localStorage.getItem(QUEST_VISIBILITY_KEY) === "available" ? "available" : "all");
  const updateQuestVisibility = (value: QuestVisibility) => { setQuestVisibility(value); localStorage.setItem(QUEST_VISIBILITY_KEY, value); };
  const [showCompletedQuests, setShowCompletedQuests] = useState(() => localStorage.getItem(SHOW_COMPLETED_QUESTS_KEY) !== "false");
  const updateShowCompletedQuests = (value: boolean) => { setShowCompletedQuests(value); localStorage.setItem(SHOW_COMPLETED_QUESTS_KEY, String(value)); };
  const [showPastEventQuests, setShowPastEventQuests] = useState(() => localStorage.getItem(SHOW_PAST_EVENT_QUESTS_KEY) !== "false");
  const updateShowPastEventQuests = (value: boolean) => { setShowPastEventQuests(value); localStorage.setItem(SHOW_PAST_EVENT_QUESTS_KEY, String(value)); };
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(() => { try { return JSON.parse(localStorage.getItem(STORY_PROGRESS_KEY) ?? "{}"); } catch { return {}; } });
  const updateStoryProgress = (chapter: string, value: StoryProgress[string]) => { const next = { ...storyProgress, [chapter]: value }; setStoryProgress(next); localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(next)); };
  const [fontScale, setFontScale] = useState(() => Math.min(200, Math.max(70, Number(localStorage.getItem("fieldnote.fontScale") ?? 100))));
  const updateFontScale = (value: number) => { const next = Math.min(200, Math.max(70, value)); setFontScale(next); localStorage.setItem("fieldnote.fontScale", String(next)); };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("fieldnote.sidebarCollapsed") === "true");
  const toggleSidebar = () => setSidebarCollapsed((collapsed) => { const next = !collapsed; localStorage.setItem("fieldnote.sidebarCollapsed", String(next)); return next; });

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(fontScale / 100));
  }, [fontScale]);
  const playerName = profile.name;
  const updateProfile = (next: PlayerProfile) => { setProfile(next); localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); };
  const resetProfileProgress = () => {
    updateProfile({ ...DEFAULT_PROFILE, level: 1, experience: 0, prestige: profile.prestige, prestigeMode: profile.prestigeMode });
    setCompletedQuests(new Set());
    setCompletedQuestAt({});
    setActiveQuests(new Set());
    setFailedQuests(new Set());
    localStorage.setItem(ACTIVE_QUESTS_KEY, "[]");
    localStorage.setItem("fieldnote.failedQuests", "[]");
    localStorage.setItem("fieldnote.completedQuests", "[]");
    localStorage.setItem(COMPLETED_QUEST_AT_KEY, "{}");
    localStorage.removeItem("fieldnote.questObjectiveProgress");
    setStoryProgress({});
    localStorage.setItem(STORY_PROGRESS_KEY, "{}");
  };

  useEffect(() => {
    if (!isTauri()) { setSqliteReady(true); return; }
    let cancelled = false;
    void (async () => {
      const db = await Database.load("sqlite:tarkov_companion.db");
      if (cancelled) return;
      await db.execute("INSERT OR IGNORE INTO profiles (profile_id, profile_name, player_level, prestige_level, experience_points, created_at, updated_at) VALUES (1, ?, ?, ?, ?, datetime('now'), datetime('now'))", [profile.name, profile.level, profile.prestige, profile.experience]);
      for (const skill of skillCatalog) await db.execute("INSERT OR IGNORE INTO skills (skill_id, name_en, category, skill_type) VALUES (?, ?, ?, 'character')", [skill.id, skill.name, skill.category]);
      const skillRows = await db.select<{ skill_id: string; level: number }[]>("SELECT skill_id, level FROM profile_skills WHERE profile_id = 1");
      const masteryRows = await db.select<{ weapon_key: string; level: number }[]>("SELECT weapon_key, level FROM profile_weapon_mastery WHERE profile_id = 1");
      if (cancelled) return;
      if (skillRows.length || masteryRows.length) {
        setProfile((current) => ({ ...current, skills: { ...current.skills, ...Object.fromEntries(skillRows.map((row) => [row.skill_id, row.level])) }, weaponMastery: Object.fromEntries(masteryRows.map((row) => [row.weapon_key, row.level])) }));
      }
      setSqliteReady(true);
    })().catch((error) => console.error("Failed to load profile skills from SQLite", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isTauri() || !sqliteReady) return;
    let cancelled = false;
    void (async () => {
      const db = await Database.load("sqlite:tarkov_companion.db");
      if (cancelled) return;
      await db.execute("UPDATE profiles SET profile_name = ?, player_level = ?, prestige_level = ?, experience_points = ?, updated_at = datetime('now') WHERE profile_id = 1", [profile.name, profile.level, profile.prestige, profile.experience]);
      for (const skill of skillCatalog) await db.execute("INSERT INTO profile_skills (profile_id, skill_id, level, updated_at) VALUES (1, ?, ?, datetime('now')) ON CONFLICT(profile_id, skill_id) DO UPDATE SET level = excluded.level, updated_at = excluded.updated_at", [skill.id, profile.skills[skill.id] ?? 0]);
      await db.execute("DELETE FROM profile_weapon_mastery WHERE profile_id = 1");
      for (const [weapon, level] of Object.entries(profile.weaponMastery)) await db.execute("INSERT INTO profile_weapon_mastery (profile_id, weapon_key, level, updated_at) VALUES (1, ?, ?, datetime('now'))", [weapon, level]);
    })().catch((error) => console.error("Failed to save profile skills to SQLite", error));
    return () => { cancelled = true; };
  }, [sqliteReady, profile.name, profile.level, profile.experience, profile.prestige, profile.skills, profile.weaponMastery]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Shield size={20} /></div><div><strong>FIELD<span>NOTE</span></strong><small>TARKOV COMPANION</small></div></div>
        <button type="button" className="sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"} title={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}>{sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
        <div className="sidebar-label">메인 메뉴</div>
        <nav aria-label="메인 메뉴">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeTab === label ? "active" : ""}`} onClick={() => setActiveTab(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><button className={`nav-item ${activeTab === "설정" ? "active" : "muted"}`} onClick={() => setActiveTab("설정")}><Settings size={18} /><span>설정</span></button></div>
        <div className="sidebar-version">FIELDNOTE v0.1.0 <span>•</span> 로컬 모드</div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb">FIELDNOTE <span>/</span> {activeTab.toUpperCase()}</div><div className="top-actions"><label className="font-scale-control" title="화면 크기 조절"><span>A</span><input type="range" min={70} max={200} step={5} value={fontScale} aria-label="글자 크기 조절" onChange={(event) => updateFontScale(Number(event.target.value))} /><strong>A</strong><output>{fontScale}%</output></label><button className="icon-button" aria-label="검색"><Search size={18} /></button><button className="icon-button notification" aria-label="알림"><Bell size={18} /><i /></button><div className="top-divider" /><button className="profile-chip" onClick={() => setActiveTab("프로필")}><div className="avatar small-avatar">{playerName.slice(0, 1)}</div><span>{playerName}</span><ChevronDown size={14} /></button></div></header>

        {activeTab === "홈" ? <HomePage playerName={playerName} onMapSelection={() => setActiveTab("맵")} onQuestSelection={() => setActiveTab("퀘스트")} /> : activeTab === "프로필" ? <ProfilePage profile={profile} updateProfile={updateProfile} completedQuests={completedQuests} setCompletedQuests={setCompletedQuests} setCompletedAt={setCompletedQuestAt} resetProfile={resetProfileProgress} /> : activeTab === "맵" ? <MapsPage completedQuests={completedQuests} activeQuests={activeQuests} /> : activeTab === "스킬" ? <SkillsPage profile={profile} updateProfile={updateProfile} /> : activeTab === "주사기" ? <InjectorsPage /> : activeTab === "탄도학" ? <BallisticsPage /> : activeTab === "설정" ? <SettingsPage questVisibility={questVisibility} setQuestVisibility={updateQuestVisibility} showCompletedQuests={showCompletedQuests} setShowCompletedQuests={updateShowCompletedQuests} showPastEventQuests={showPastEventQuests} setShowPastEventQuests={updateShowPastEventQuests} /> : activeTab === "아이템" ? <ItemsPage /> : activeTab === "퀘스트" ? <QuestsPage completed={completedQuests} setCompleted={setCompletedQuests} completedAt={completedQuestAt} setCompletedAt={setCompletedQuestAt} activeQuests={activeQuests} setQuestActive={updateQuestActive} failedQuests={failedQuests} setQuestFailed={updateQuestFailed} profile={profile} updateProfile={updateProfile} questVisibility={questVisibility} showCompletedQuests={showCompletedQuests} showPastEventQuests={showPastEventQuests} storyProgress={storyProgress} updateStoryProgress={updateStoryProgress} /> : <ComingSoon tab={activeTab} />}
      </main>
    </div>
  );
}

function mapNameKey(value: string) {
  const key = value.toLowerCase().replace(/[^a-z]/g, "");
  return key === "lab" || key === "thelab" ? "labs" : key === "streetsoftarkov" ? "streets" : key;
}
function questMatchesMap(quest: QuestRecord, map: MapOption) {
  if (!quest.map) return false;
  const mapKey = mapNameKey(map.normalizedName);
  return quest.map.split(/,|\bor\b/i).some((name) => mapNameKey(name.trim()) === mapKey);
}
function questReferenceCategories(quest: QuestRecord): Set<MarkerCategoryId> {
  const text = `${quest.title} ${quest.content}`.toLowerCase();
  const categories = new Set<MarkerCategoryId>();
  if (/extract|survive and extract|evacuate/.test(text)) ["extracts", "pmcExtracts", "scavExtracts", "coopExtracts"].forEach((id) => categories.add(id as MarkerCategoryId));
  if (/eliminate|kill|neutralize|defeat/.test(text)) ["bosses", "pmcSpawns", "scavSpawns", "sniperScavs"].forEach((id) => categories.add(id as MarkerCategoryId));
  if (/switch|lever|power station|electric|generator/.test(text)) categories.add("switches");
  if (/locate|find|obtain|stash|mark|plant|place|search/.test(text)) ["lootContainers", "lootLoose", "hazards", "switches"].forEach((id) => categories.add(id as MarkerCategoryId));
  return categories;
}

function MapsPage({ completedQuests, activeQuests }: { completedQuests: Set<number>; activeQuests: Set<number> }) {
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "cached">("cached");
  const [error, setError] = useState("");
  const [hiddenMarkers, setHiddenMarkers] = useState<Set<string>>(() => new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<MarkerCategoryId>>(() => new Set());
  const [markerSearch, setMarkerSearch] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [questPayload, setQuestPayload] = useState<QuestPayload | null>(null);
  const [focusedQuestId, setFocusedQuestId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/quests/quests.en.json").then((response) => response.json() as Promise<QuestPayload>).then((payload) => { if (!cancelled) setQuestPayload(payload); }).catch((reason) => console.error("Failed to load quests for map markers", reason));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMaps() {
      try {
        const [catalogResponse, cachedResponse] = await Promise.all([
          fetch("/maps/catalog.json"),
          fetch("/maps/regular.json"),
        ]);
        if (!catalogResponse.ok || !cachedResponse.ok) throw new Error("저장된 맵 자료를 읽지 못했습니다.");
        const catalog = (await catalogResponse.json()) as MapCatalogEntry[];
        const cachedPayload = await cachedResponse.json();
        const cachedMaps = Object.values((cachedPayload.data?.maps ?? cachedPayload) as Record<string, TarkovMap>);
        const cachedOptions = toMapOptions(cachedMaps, catalog);
        if (!cancelled) {
          setMaps(cachedOptions);
          setSelectedName((current) => current || cachedOptions[0]?.normalizedName || "");
          setLoading(false);
        }

        try {
          const liveResponse = await fetch("https://json.tarkov.dev/regular/maps_ko");
          if (!liveResponse.ok) throw new Error(`API 응답 오류 (${liveResponse.status})`);
          const livePayload = await liveResponse.json();
          const liveMaps = Object.values((livePayload.data?.maps ?? livePayload.data) as Record<string, TarkovMap>);
          const liveOptions = toMapOptions(liveMaps, catalog);
          if (!liveOptions.length) throw new Error("API에서 맵 목록을 찾지 못했습니다.");
          if (!cancelled) {
            setMaps(liveOptions);
            setSource("live");
            setError("");
          }
        } catch {
          if (!cancelled) setError("Tarkov.dev에 연결할 수 없어 저장된 맵 데이터를 표시합니다.");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "맵 데이터를 불러오지 못했습니다.");
          setLoading(false);
        }
      }
    }

    void loadMaps();
    return () => { cancelled = true; };
  }, []);

  const selectedMap = maps.find((map) => map.normalizedName === selectedName);
  const mapMarkers = selectedMap ? getMapMarkers(selectedMap) : [];
  const mapMarkerCategories = getMapMarkerCategories(mapMarkers);
  const visibleMarkers = [...new globalThis.Map(mapMarkers.filter((marker) => !hiddenMarkers.has(marker.id)).map((marker) => [marker.groupId ?? marker.id, marker])).values()];
  const activeMapQuests = questPayload?.quests.filter((quest) => activeQuests.has(quest.id) && !completedQuests.has(quest.id) && !!selectedMap && questMatchesMap(quest, selectedMap)) ?? [];
  const focusedQuest = activeMapQuests.find((quest) => quest.id === focusedQuestId) ?? null;
  const questReferenceMarkers = focusedQuest ? mapMarkers.filter((marker) => questReferenceCategories(focusedQuest).has(marker.category)) : [];
  const questReferenceIds = new Set(questReferenceMarkers.map((marker) => marker.id));
  const mapLayerMarkers = [...new globalThis.Map([...visibleMarkers, ...questReferenceMarkers].map((marker) => [marker.groupId ?? marker.id, marker])).values()];

  useEffect(() => {
    setHiddenMarkers(new Set(mapMarkers.map((marker) => marker.id)));
    setSelectedMarker(null);
    setFocusedQuestId(null);
    setMarkerSearch("");
  }, [selectedName]);

  const toggleCategory = (categoryId: MarkerCategoryId) => {
    const categoryMarkers = mapMarkers.filter((marker) => marker.category === categoryId);
    setHiddenMarkers((current) => {
      const next = new Set(current);
      const allVisible = categoryMarkers.length > 0 && categoryMarkers.every((marker) => !current.has(marker.id));
      for (const marker of categoryMarkers) {
        if (allVisible) next.add(marker.id);
        else next.delete(marker.id);
      }
      return next;
    });
  };

  const toggleMarker = (markerId: string) => {
    setHiddenMarkers((current) => {
      const next = new Set(current);
      if (next.has(markerId)) next.delete(markerId);
      else next.add(markerId);
      return next;
    });
  };

  return (
    <div className="page-content maps-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="live-dot" /> RAID PLANNER</div>
          <h1>다음 레이드 <em>맵 선택</em></h1>
          <p>Tarkov.dev에서 맵 정보와 출구 데이터를 불러옵니다.</p>
        </div>
        <span className={`map-source ${source}`}><i /> {source === "live" ? "TARKOV.DEV LIVE" : "SAVED DATA"}</span>
      </div>

      <section className="map-toolbar">
        <div className="map-select-label"><MapPin size={16} /><div><span className="eyebrow">LOCATION</span><strong>레이드 지역</strong></div></div>
        <select aria-label="레이드 맵 선택" value={selectedName} onChange={(event) => setSelectedName(event.target.value)} disabled={loading || maps.length === 0}>
          {maps.map((map) => <option key={map.id} value={map.normalizedName}>{map.displayName}</option>)}
        </select>
        {selectedMap && <span className="map-raid-length"><Clock3 size={14} /> {selectedMap.raidDuration ?? "—"}분 레이드</span>}
      </section>

      {error && <div className="map-notice" role="status">{error}</div>}
      {loading ? <div className="map-loading">Tarkov.dev 맵 데이터를 불러오는 중...</div> : selectedMap ? (
        <section className="map-layout">
          <div className="map-image-panel">
            <div className="map-image-heading"><span>TACTICAL OVERVIEW</span><b>{selectedMap.displayName}</b></div>
            <div className="map-canvas" style={{ aspectRatio: selectedMap.aspectRatio }}>
              <img src={selectedMap.imagePath} alt={`${selectedMap.displayName} 지도`} />
              <div className="map-marker-layer" aria-label={`${selectedMap.displayName} 마커`}>
                {mapLayerMarkers.map((marker) => {
                  const point = projectMapMarker(marker.position, selectedMap.bounds, selectedMap.coordinateRotation);
                  const category = mapMarkerCategories.find((item) => item.id === marker.category);
                  if (!point || !category) return null;
                  return (
                    <button
                      key={marker.id}
                      type="button"
                      className={`map-marker marker-${marker.category}${selectedMarker?.id === marker.id ? " selected" : ""}${questReferenceIds.has(marker.id) ? " quest-related" : ""}`}
                      style={{ left: `${point.left}%`, top: `${point.top}%` }}
                      title={marker.label}
                      aria-label={marker.label}
                      onClick={() => setSelectedMarker(marker)}
                    >
                      {category.symbol}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="map-image-credit">Map data and artwork: Tarkov.dev</span>
          </div>
          <aside className="map-details panel">
            <div className="panel-heading"><div><span className="eyebrow">DEPLOYMENT BRIEF</span><h3>{selectedMap.displayName}</h3></div><Map size={18} className="panel-icon" /></div>
            <div className="map-stat"><span>참가 인원</span><b>{selectedMap.players ?? "정보 없음"}</b></div>
            <div className="map-stat"><span>레이드 시간</span><b>{selectedMap.raidDuration ? `${selectedMap.raidDuration}분` : "정보 없음"}</b></div>
            <section className="map-active-quests"><div className="marker-controls-heading"><div><span className="eyebrow">CURRENT QUESTS</span><strong>진행 중 퀘스트</strong></div><span>{activeMapQuests.length}</span></div>{activeMapQuests.length ? activeMapQuests.map((quest) => <button type="button" key={quest.id} className={`map-active-quest ${focusedQuestId === quest.id ? "selected" : ""}`} onClick={() => setFocusedQuestId((current) => current === quest.id ? null : quest.id)}><strong>{getQuestTitle(quest)}</strong><small>{questObjectives(quest).map((objective) => objective.text).join(" · ")}</small></button>) : <p className="field-hint">이 지도에 배정된 미완료 퀘스트가 없습니다.</p>}{focusedQuest && <p className="map-quest-marker-note">선택 퀘스트의 목표 유형과 관련된 맵 마커를 강조합니다. 좌표가 위키 데이터에 없는 목표는 정확한 지점 대신 관련 마커 유형을 표시합니다.</p>}</section>
            <div className="map-marker-controls">
              <div className="marker-controls-heading">
                <div><span className="eyebrow">MAP MARKERS</span><strong>마커 표시</strong></div>
                <span>{visibleMarkers.length}/{new Set(mapMarkers.map((marker) => marker.groupId ?? marker.id)).size}</span>
              </div>
              <div className="marker-global-actions">
                <button type="button" onClick={() => setHiddenMarkers(new Set())}><Eye size={13} /> 전체 표시</button>
                <button type="button" onClick={() => setHiddenMarkers(new Set(mapMarkers.map((marker) => marker.id)))}><EyeOff size={13} /> 전체 숨기기</button>
              </div>
              <label className="marker-search"><Search size={13} /><input value={markerSearch} onChange={(event) => setMarkerSearch(event.target.value)} placeholder="마커 이름 검색" /></label>
              <div className="marker-category-list">
                {mapMarkerCategories.map((category) => {
                  const markers = mapMarkers.filter((marker) => marker.category === category.id);
                  const shown = markers.filter((marker) => !hiddenMarkers.has(marker.id)).length;
                  const allVisible = markers.length > 0 && shown === markers.length;
                  const expanded = expandedCategories.has(category.id);
                  const filtered = markers.filter((marker) => marker.label.toLocaleLowerCase().includes(markerSearch.toLocaleLowerCase()));
                  return (
                    <section className={`marker-category ${allVisible ? "" : "category-hidden"}`} key={category.id}>
                      <div className="marker-category-heading">
                        <label>
                          <input type="checkbox" checked={allVisible} disabled={markers.length === 0} onChange={() => toggleCategory(category.id)} />
                          <i className={`marker-key marker-${category.id}`}>{category.symbol}</i>
                          <span>{category.label}</span>
                          <small>{shown}/{markers.length}</small>
                        </label>
                        <button type="button" aria-label={`${category.label} 마커 목록 ${expanded ? "접기" : "펼치기"}`} onClick={() => setExpandedCategories((current) => {
                          const next = new Set(current);
                          if (next.has(category.id)) next.delete(category.id);
                          else next.add(category.id);
                          return next;
                        })}>{expanded ? "−" : "+"}</button>
                      </div>
                      {expanded && <div className="marker-item-list">
                        {filtered.length ? filtered.map((marker) => <label className={hiddenMarkers.has(marker.id) ? "marker-item disabled" : "marker-item"} key={marker.id}>
                          <input type="checkbox" checked={!hiddenMarkers.has(marker.id)} onChange={() => toggleMarker(marker.id)} />
                          <span title={marker.label}>{marker.label}</span>
                        </label>) : <p className="marker-empty">검색 결과가 없습니다.</p>}
                      </div>}
                    </section>
                  );
                })}
              </div>
              {selectedMarker && <div className="selected-marker-info"><i className={`marker-key marker-${selectedMarker.category}`}>{mapMarkerCategories.find((category) => category.id === selectedMarker.category)?.symbol}</i><span>{selectedMarker.label}</span><button type="button" onClick={() => setSelectedMarker(null)} aria-label="선택한 마커 닫기">×</button></div>}
            </div>
          </aside>
        </section>
      ) : <div className="map-loading">표시할 수 있는 맵 데이터가 없습니다.</div>}
    </div>
  );
}

const questTraders = ["Prapor", "Therapist", "Fence", "Skier", "Peacekeeper", "Mechanic", "Ragman", "Jaeger", "Lightkeeper", "Ref", "BTR Driver"];

function getQuestTrader(quest: QuestRecord) {
  if (quest.trader) return quest.trader;
  const text = quest.content.toLowerCase();
  return questTraders.find((trader) => text.includes(trader.toLowerCase())) ?? "Other";
}
function getQuestTitle(quest: QuestRecord) {
  return normalizeKoreanSpacing(quest.titleKo?.trim() || quest.title);
}
function normalizeKoreanSpacing(text: string) {
  return text.replace(/(?<=[\uAC00-\uD7A3])\s+(?:\uC740|\uB294|\uC774|\uAC00|\uC744|\uB97C|\uC640|\uACFC|\uB3C4|\uB9CC|\uC758|\uC5D0\uC11C|\uC5D0\uAC8C|\uD55C\uD14C|\uC73C\uB85C|\uC5D0|\uB85C|\uAE4C\uC9C0|\uBD80\uD130|\uBCF4\uB2E4)(?=[\uAC00-\uD7A3])/g, (match) => match.trimStart());
}

const traderNamesKo: Record<string, string> = {
  Prapor: "프라포르", Therapist: "테라피스트", Fence: "펜스", Skier: "스키어", Peacekeeper: "피스키퍼",
  Mechanic: "메카닉", Ragman: "래그맨", Jaeger: "예거", Lightkeeper: "라이트키퍼", Ref: "리플", "BTR Driver": "BTR 운전기사",
};
const mapNamesKo: Record<string, string> = {
  Woods: "삼림", Customs: "세관", Factory: "공장", Shoreline: "해안선", Reserve: "리저브", Lighthouse: "등대",
  Interchange: "인터체인지", "Ground Zero": "그라운드 제로", "Streets of Tarkov": "타르코프 시내", "The Lab": "연구소", Lab: "연구소",
};
const toKoreanTrader = (name: string) => name.split(" or ").map((part) => traderNamesKo[part] ?? part).join(" 또는 ");
const toKoreanMap = (name: string) => name.split(", ").map((part) => mapNamesKo[part] ?? part).join(", ");

function getQuestSections(content: string) {
  return [...content.matchAll(/^==\s*(.*?)\s*==\s*$/gm)].map((match, index, matches) => ({
    title: match[1],
    text: content.slice(match.index! + match[0].length, matches[index + 1]?.index ?? content.length).trim(),
  })).filter(({ text }) => text.length > 0);
}
function getQuestPrerequisites(quest: QuestRecord) {
  return quest.wikiPrerequisites ?? quest.prerequisites;
}
function getQuestRequirements(quest: QuestRecord) {
  const source = quest.wikiRequirements ?? getQuestSections(quest.content).find((section) => section.title.toLowerCase() === "requirements")?.text ?? "";
  const modeAccess = questModeAccessDescription(quest);
  return [source, modeAccess ? `모드별 요구조건: ${modeAccess}` : ""].filter(Boolean).join("\n");
}
function questModeAccessDescription(quest: QuestRecord) {
  const format = (mode: "pve" | "pvp") => {
    const variants = questAccessData.modes[mode][questWikiPage(quest)] ?? [];
    return [...new Set(variants.map((variant) => [
      variant.playerLevel > 0 ? `레벨 ${variant.playerLevel} 이상` : "",
      ...variant.traderRequirements.map((requirement) => requirement.type === "level"
        ? `${toKoreanTrader(requirement.trader)} LL${requirement.value} 이상`
        : `${toKoreanTrader(requirement.trader)} 평판 ${requirement.compare} ${requirement.value}`),
      ...variant.taskRequirements.map((requirement) => `${requirement.statuses.includes("active") ? "진행" : requirement.statuses.includes("failed") ? "실패" : "완료"}: ${requirement.title.replaceAll("-", " ")}`),
      ...variant.taskRequirements.map((requirement) => `${requirement.statuses.includes("active") ? "진행" : requirement.statuses.includes("failed") ? "실패" : "완료"}: ${requirement.title.replaceAll("-", " ")}`),
    ].filter(Boolean).join(" · ")))].filter(Boolean).join(" 또는 ");
  };
  const pve = format("pve");
  const pvp = format("pvp");
  if (pve && pve === pvp) return pve;
  return [pve ? `PvE ${pve}` : "", pvp ? `PvP ${pvp}` : ""].filter(Boolean).join(" / ");
}

function getQuestTraderReputationRewards(quest: QuestRecord) {
  const rewardText = getQuestSections(quest.content).find((section) => section.title.toLowerCase() === "rewards")?.text ?? "";
  return [...rewardText.matchAll(/^([A-Za-z][A-Za-z ]*?)\s+Rep\s+([+-]?[0-9]+(?:\.[0-9]+)?)\s*$/gim)]
    .map((match) => [match[1].trim(), Number(match[2])] as const);
}

const OBJECTIVE_PROGRESS_KEY = "fieldnote.questObjectiveProgress";
type ObjectiveState = Record<string, number[]>;
function questObjectives(quest: QuestRecord, showOriginal = false) {
  const translated = quest.objectivesKo?.filter(Boolean) ?? [];
  const source = getQuestSections(quest.content).find((section) => section.title.toLowerCase() === "objectives")?.text ?? "";
  const sourceLines = source.split("\n").map((line) => line.replace(/^\s*[*#:-]+\s*/, "").trim()).filter(Boolean);
  const lines = showOriginal || !translated.length ? sourceLines : translated;
  return lines.map((rawText) => { const text = showOriginal ? rawText : normalizeKoreanSpacing(rawText); return { text, total: Math.max(1, Number(text.match(/(?:×|x|times?\s+|\b)(\d+)\s*(?:회|개|명|마리|곳|items?|kills?|scavs?|pmcs?)?/i)?.[1] ?? 1)) }; });
}
function explicitTraderLevel(quest: QuestRecord) {
  const requirements = getQuestRequirements(quest);
  const match = `${getQuestPrerequisites(quest)}\n${requirements}`.match(/(?:loyalty level|LL)\s*[-:]?\s*([1-4])/i);
  return match ? Number(match[1]) : null;
}
function prerequisiteGroups(raw: string, quests: QuestRecord[]) {
  const normalized = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  const source = normalized(raw);
  if (!source || source === "seerequirements") return [];
  const candidates = quests.map((quest) => ({ quest, title: normalized(quest.title.replace(/\s+\(quest\)$/i, "")) })).filter((entry) => entry.title.length >= 4);
  const matches: { id: number; start: number; end: number }[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    const found = candidates.filter(({ title }) => source.startsWith(title, cursor)).sort((a, b) => b.title.length - a.title.length)[0];
    if (found) {
      matches.push({ id: found.quest.id, start: cursor, end: cursor + found.title.length });
      cursor += found.title.length;
    } else cursor++;
  }
  if (!matches.length) return [];
  const groups: number[][] = [[matches[0].id]];
  for (let index = 1; index < matches.length; index++) {
    const previous = matches[index - 1];
    const current = matches[index];
    const connector = source.slice(previous.end, current.start);
    if (connector === "or") groups[groups.length - 1].push(current.id);
    else groups.push([current.id]);
  }
  return groups;
}
function questConditionLabel(quest: QuestRecord, quests: QuestRecord[]) {
  const prerequisite = getQuestPrerequisites(quest);
  const groups = prerequisiteGroups(prerequisite, quests);
  const requirements = getQuestRequirements(quest).trim();
  const previousQuests = groups.map((group) => group.map((id) => quests.find((item) => item.id === id)?.titleKo?.trim() || quests.find((item) => item.id === id)?.title || "").filter(Boolean).join(" 또는 ")).join(" + ");
  const conditions = [previousQuests || prerequisite.trim(), requirements?.replace(/\s+/g, " ")].filter(Boolean);
  return conditions.join(" · ");
}
function traderQuestAccessMet(trader: string, payload: QuestPayload, completed: Set<number>, activeQuests: Set<number>, storyProgress: StoryProgress) {
  if (["Prapor", "Skier", "Mechanic", "Peacekeeper"].includes(trader) && (storyProgress.Tour ?? "not-started") === "not-started") return false;
  const accessQuest = trader === "Jaeger" ? { title: "Introduction", accept: false }
    : trader === "Ref" ? { title: "Easy Money - Part 1", accept: false }
      : trader === "Peacekeeper" ? { title: "Friend From the West - Part 2", accept: false }
        : trader === "BTR Driver" ? { title: "A Helping Hand", accept: true }
          : null;
  if (!accessQuest) return true;
  const quest = payload.quests.find((item) => item.title === accessQuest.title);
  if (!quest) return false;
  return completed.has(quest.id) || (accessQuest.accept && activeQuests.has(quest.id));
}
function hasUnresolvedQuestRequirement(requirements: string, quests: QuestRecord[]) {
  let questList = false;
  for (const rawLine of requirements.split("\n")) {
    const line = rawLine.trim().replace(/^[*#:-]+\s*/, "");
    if (!line) continue;
    if (line.startsWith("모드별 요구조건:")) continue;
    if (/^complete the quests?:$/i.test(line)) { questList = true; continue; }
    if (questList) {
      if (!prerequisiteGroups(line, quests).length) return true;
      continue;
    }
    if (/must be playing in the seasonal mode|only obtainable by (?:bear|usec) pmcs|only available to buyers of the .* edition/i.test(line)) continue;
    if (/(?:must be|reach|required(?: to start)?|minimum)\s+(?:a\s+)?level\s+\d+|\blevel\s+\d+\s+(?:is required|minimum)/i.test(line)) continue;
    if (/(?:reach\s+)?(?:loyalty level|LL)\s*[1-4]\s+with\s+/i.test(line)) continue;
    if (/scav karma of (?:at least\s+)?[+-]?\d+(?:\.\d+)?/i.test(line)) continue;
    if (/(?:must\s+)?accept\s+.+?(?:\s+to obtain this quest)?[.!]?$/i.test(line)) continue;
    if (/(?:unlock|unlocks)\s+.+?\s+after completion of\s+.+/i.test(line)) continue;
    if (/\bcomplete\s+.+/i.test(line)) continue;
    if (/story chapter/i.test(line)) continue;
    return true;
  }
  return false;
}
function questConditionsMet(quest: QuestRecord, payload: QuestPayload, completed: Set<number>, completedAt: Record<number, number>, activeQuests: Set<number>, failedQuests: Set<number>, profile: PlayerProfile, storyProgress: StoryProgress) {
  if (!isQuestAvailableInMode(quest, profile.prestigeMode)) return false;
  const modeData = questAccessData.modes[profile.prestigeMode === "PVE" ? "pve" : "pvp"][questWikiPage(quest)];
  const apiParentFor = (requirement: QuestAccessTaskRequirement) => {
    const parentKey = questPageKey(requirement.page);
    const parentTitleKey = questPageKey(requirement.title);
    return payload.quests.find((candidate) => questPageKey(questWikiPage(candidate)) === parentKey || questPageKey(candidate.title) === parentTitleKey);
  };
  const apiPrerequisitesAvailable = modeData !== undefined && modeData.every((variant) => variant.taskRequirements.every((requirement) => !!apiParentFor(requirement)));
  const apiTaskRequirementMet = (requirement: QuestAccessTaskRequirement) => {
    const parent = apiParentFor(requirement);
    if (!parent) return true;
    const statuses = requirement.statuses.map((status) => status.toLowerCase());
    return statuses.some((status) => status === "complete" ? completed.has(parent.id) : status === "active" ? activeQuests.has(parent.id) : status === "failed" ? failedQuests.has(parent.id) : false);
  };
  const meetsModeAccess = (variant: QuestAccessVariant) => profile.level >= variant.playerLevel && variant.traderRequirements.every((requirement) => {
    const actual = requirement.type === "level"
      ? traderLevel(requirement.trader, profile.traderRep[requirement.trader] ?? 0, profile.level, profile.traderSales[requirement.trader] ?? 0) ?? 0
      : profile.traderRep[requirement.trader] ?? 0;
    return questRequirementMet(actual, requirement);
  }) && variant.taskRequirements.every(apiTaskRequirementMet);
  if (modeData?.length && !modeData.some(meetsModeAccess)) return false;
  const questTraders = getQuestTrader(quest).split(/\s+or\s+/i);
  if (!questTraders.some((trader) => traderQuestAccessMet(trader, payload, completed, activeQuests, storyProgress))) return false;
  const prerequisite = getQuestPrerequisites(quest).trim();
  if (prerequisite && !apiPrerequisitesAvailable) {
    const groups = prerequisiteGroups(prerequisite, payload.quests);
    if (!groups.length && !/^see requirements$/i.test(prerequisite)) return false;
    const prerequisiteAccepted = /^accept\s+/i.test(prerequisite);
    if (groups.some((group) => !group.some((questId) => completed.has(questId) || (prerequisiteAccepted && activeQuests.has(questId))))) return false;
  }
  const requirements = getQuestRequirements(quest);
  const levelMatch = apiPrerequisitesAvailable ? null : requirements.match(/(?:must be|reach|required(?: to start)?|minimum)\s+(?:a\s+)?level\s+(\d+)|\blevel\s+(\d+)\s+(?:is required|minimum)/i);
  if (levelMatch && profile.level < Number(levelMatch[1] ?? levelMatch[2])) return false;
  const skillMatch = requirements.match(/(?:required\s+)?(\d+)\s+([A-Za-z ]+?)\s+skill\s+level/i);
  if (skillMatch) {
    const skill = skillCatalog.find((item) => item.name.toLowerCase() === skillMatch[2].trim().toLowerCase());
    if (skill && (profile.skills[skill.id] ?? 0) < Number(skillMatch[1])) return false;
  }
  const loyaltyRequirements = apiPrerequisitesAvailable ? [] : [...requirements.matchAll(/(?:reach\s+)?(?:loyalty level|LL)\s*([1-4])\s+with\s+([^.!\n]+)/gi)];
  for (const match of loyaltyRequirements) {
    const level = Number(match[1]);
    const namedTraders = traderOrder.filter((name) => match[2].toLowerCase().includes(name.toLowerCase()));
    if (namedTraders.some((name) => (traderLevel(name, profile.traderRep[name] ?? 0, profile.level, profile.traderSales[name] ?? 0) ?? 0) < level)) return false;
  }
  const acceptanceRequirements = apiPrerequisitesAvailable ? [] : [...requirements.matchAll(/(?:must\s+)?accept\s+(.+?)(?:\s+to obtain this quest)?[.!]?$/gim)];
  for (const match of acceptanceRequirements) {
    const groups = prerequisiteGroups(match[1], payload.quests);
    if (!groups.length || groups.some((group) => !group.some((questId) => completed.has(questId) || activeQuests.has(questId)))) return false;
  }
  const timedUnlockRequirements = [...requirements.matchAll(/unlock(?:s|ed)?\s+(\d+)\s+(hours?|minutes?)\s+after completion of\s+([^.\n]+)/gi)];
  for (const match of timedUnlockRequirements) {
    const groups = prerequisiteGroups(match[3], payload.quests);
    if (!groups.length) return false;
    const delay = Number(match[1]) * (/hour/i.test(match[2]) ? 60 * 60 * 1000 : 60 * 1000);
    for (const group of groups) {
      const completedOptions = group.filter((questId) => completed.has(questId));
      if (!completedOptions.length) return false;
      if (!completedOptions.some((questId) => !completedAt[questId] || Date.now() - completedAt[questId] >= delay)) return false;
    }
  }
  // Do not assign an unnamed LL requirement to the quest's issuer.
  const karma = requirements.match(/scav karma of (?:at least\s+)?([+-]?\d+(?:\.\d+)?)/i);
  if (karma) {
    const required = Number(karma[1]);
    const actual = profile.traderRep.Fence ?? 0;
    if (/at least/i.test(karma[0]) ? actual < required : required < 0 ? actual > required : actual < required) return false;
  }
  if (/must be playing in the seasonal mode/i.test(requirements)) return false;
  if (/only obtainable by BEAR PMCs/i.test(requirements)) return false;
  if (/only obtainable by buyers of the .* edition/i.test(requirements)) return false;
  if (hasUnresolvedQuestRequirement(requirements, payload.quests)) return false;
  const namedRequirementQuests = apiPrerequisitesAvailable ? [] : prerequisiteGroups(requirements, payload.quests);
  if (!apiPrerequisitesAvailable && /complete the quests?:/i.test(requirements) && namedRequirementQuests.some((group) => !group.some((questId) => completed.has(questId)))) return false;
  for (const line of (apiPrerequisitesAvailable ? [] : requirements.split("\n").map((value) => value.trim()).filter((value) => /^complete\s+(?!the quests?:)/i.test(value)))) {
    const groups = prerequisiteGroups(line, payload.quests);
    if (!groups.length || groups.some((group) => !group.some((questId) => completed.has(questId)))) return false;
  }
  for (const chapter of mainStoryChapters) {
    if (!requirements.toLowerCase().includes(chapter.title.toLowerCase()) || !/story chapter/i.test(requirements)) continue;
    const state = storyProgress[chapter.title] ?? "not-started";
    const explicitlyNeedsCompletion = new RegExp(`complete[^.\\n]*story chapter[^.\\n]*${chapter.title.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`, "i").test(requirements);
    if (state === "not-started" || (explicitlyNeedsCompletion && state !== "completed")) return false;
  }
  return true;
}
const mainStoryChapters = [
  { title: "Tour", description: "테라그룹 사무실 공격 뒤 지휘부와 연락이 끊긴 상황에서 그라운드 제로를 탈출하고, 타르코프의 다른 지역으로 나아갈 길을 찾습니다.", url: "https://escapefromtarkov.fandom.com/wiki/Tour" },
  { title: "Falling Skies", description: "숲에 추락한 비행기의 흔적과 비행 기록 장치를 조사하며, 사고에 얽힌 인물과 중요한 물자를 추적합니다.", url: "https://escapefromtarkov.fandom.com/wiki/Falling_Skies" },
  { title: "The Ticket", description: "타르코프를 빠져나갈 단서를 쫓고, 핵심 인물들과의 선택을 통해 이야기의 결말로 이어지는 길을 결정합니다.", url: "https://escapefromtarkov.fandom.com/wiki/The_Ticket" },
  { title: "Batya", description: "타르코프에 투입된 BEAR 특수부대 보가티르 분대의 흔적을 찾아 그들의 임무와 행방을 조사합니다.", url: "https://escapefromtarkov.fandom.com/wiki/Batya" },
  { title: "Accidental Witness", description: "기숙사 앞 차량에 남겨진 협박 문구에서 시작해 코즐로프와 여러 인물의 채무, 행방, 사건의 증거를 추적합니다.", url: "https://escapefromtarkov.fandom.com/wiki/Accidental_Witness" },
  { title: "Blue Fire", description: "도시를 덮친 강력한 EMP의 정체와 배후를 조사하고, 테라그룹의 Item 1156 관련 기술을 추적합니다.", url: "https://escapefromtarkov.fandom.com/wiki/Blue_Fire" },
  { title: "Boreas", description: "봉쇄된 핀란드만의 핵 추진 쇄빙선 보레아스를 조사해 선박과 화물, 승무원에게 무슨 일이 있었는지 밝혀냅니다.", url: "https://escapefromtarkov.fandom.com/wiki/Boreas" },
  { title: "The Labyrinth", description: "헬스 리조트 지하에 숨겨진 테라그룹 시설을 조사하고, 그곳에서 BEAR 분대와 연구원들에게 일어난 일을 알아냅니다.", url: "https://escapefromtarkov.fandom.com/wiki/The_Labyrinth_(story_chapter)" },
  { title: "The Unheard", description: "테라그룹 문서에 적힌 ‘정화’와 연료 촉매의 단서를 따라가며, The Unheard의 계획과 타르코프에서의 역할을 조사합니다.", url: "https://escapefromtarkov.fandom.com/wiki/The_Unheard" },
  { title: "They Are Already Here", description: "기이한 상징과 컬티스트의 흔적을 여러 지역에서 추적하고, Eye of the World와 ARRS 시설의 비밀을 조사합니다.", url: "https://escapefromtarkov.fandom.com/wiki/They_Are_Already_Here" },
];
const traderPortraitSlug: Record<string, string> = { Prapor: "prapor", Therapist: "therapist", Fence: "fence", Skier: "skier", Peacekeeper: "peacekeeper", Mechanic: "mechanic", Ragman: "ragman", Jaeger: "jaeger", Lightkeeper: "lightkeeper", Ref: "ref", "BTR Driver": "btr-driver" };

function SettingsPage({ questVisibility, setQuestVisibility, showCompletedQuests, setShowCompletedQuests, showPastEventQuests, setShowPastEventQuests }: { questVisibility: QuestVisibility; setQuestVisibility: (value: QuestVisibility) => void; showCompletedQuests: boolean; setShowCompletedQuests: (value: boolean) => void; showPastEventQuests: boolean; setShowPastEventQuests: (value: boolean) => void }) {
  return <div className="page-content settings-page"><div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> FIELDNOTE CONFIGURATION</div><h1>설정 <em>환경 설정</em></h1><p>퀘스트 목록에 표시할 임무 범위를 선택합니다.</p></div></div><section className="panel settings-panel"><div className="panel-heading"><div><span className="eyebrow">QUEST DISPLAY</span><h3>퀘스트 표시 조건</h3></div><Settings size={18} className="panel-icon" /></div><label className={`settings-choice ${questVisibility === "available" ? "selected" : ""}`}><input type="radio" name="quest-visibility" checked={questVisibility === "available"} onChange={() => setQuestVisibility("available")} /><span><strong>조건이 충족된 퀘스트만 보기</strong><small>프로필 레벨, 보유 스킬, 완료한 선행 퀘스트, 상인 평판 등 확인 가능한 조건을 적용합니다.</small></span></label><label className={`settings-choice ${questVisibility === "all" ? "selected" : ""}`}><input type="radio" name="quest-visibility" checked={questVisibility === "all"} onChange={() => setQuestVisibility("all")} /><span><strong>모든 퀘스트 보기</strong><small>잠금 여부와 관계없이 전체 퀘스트를 표시합니다.</small></span></label><div className="settings-divider" /><div className="settings-toggle-row"><span><strong>완료한 퀘스트 표시</strong><small>끄면 완료 표시된 퀘스트를 목록에서 숨깁니다. 완료 상태는 유지됩니다.</small></span><input type="checkbox" role="switch" aria-label="완료한 퀘스트 표시" checked={showCompletedQuests} onChange={(event) => setShowCompletedQuests(event.target.checked)} /></div><div className="settings-toggle-row"><span><strong>지난 이벤트 퀘스트 표시</strong><small>끄면 크리스마스·할로윈 등 기간 한정 이벤트 임무를 퀘스트 목록에서 숨깁니다.</small></span><input type="checkbox" role="switch" aria-label="지난 이벤트 퀘스트 표시" checked={showPastEventQuests} onChange={(event) => setShowPastEventQuests(event.target.checked)} /></div><p className="field-hint">선택은 이 기기에 자동 저장됩니다. 위키 데이터에 조건이 명시되지 않은 임무는 조건 충족 보기에서 제외될 수 있습니다.</p></section></div>;
}

function isPastEventQuest(quest: QuestRecord) {
  const eventPattern = /christmas|new year|halloween|snow maiden|easter|valentine|anniversary|april fools|seasonal mode|event quest/i;
  return eventPattern.test(`${quest.title} ${quest.content.slice(0, 1_200)}`);
}

function StoryChapterInfo({ chapter }: { chapter: string }) {
  const note = storyChapterNotes[chapter];
  if (!note) return null;
  return <section className="story-chapter-info"><span className="eyebrow">WIKI STORY NOTES</span><p>{note.overview}</p>{note.choices && <p className="story-choice-note">선택·분기: {note.choices}</p>}{!!note.achievements?.length && <p className="story-achievement-note">관련 업적: {note.achievements.join(" · ")}</p>}<small>내용과 업적 조건은 영문 위키 챕터 문서를 기준으로 요약했습니다.</small></section>;
}

function TicketEndingPanel({ ending, onChange }: { ending: TicketEnding; onChange: (value: TicketEnding) => void }) {
  const route = ticketEndings[ending];
  return <section className="ticket-ending-panel"><div className="ticket-ending-heading"><div><span className="eyebrow">ENDING ROUTE</span><h3>The Ticket · {ending}</h3></div><label>목표 엔딩<select value={ending} onChange={(event) => onChange(event.target.value as TicketEnding)}>{Object.keys(ticketEndings).map((name) => <option key={name} value={name}>{name}</option>)}</select></label></div><p>{route.premise}</p><ol>{route.steps.map((step) => <li key={step}>{step}</li>)}</ol><div className="ticket-ending-achievement"><strong>관련 업적</strong><span>{route.achievement}</span></div><p className="ticket-ending-warning">분기 주의: {route.lockouts}</p><a href={storyChapterWiki["The Ticket"]} target="_blank" rel="noreferrer">영문 위키 · 분기와 목표 확인 ↗</a></section>;
}

function QuestsPage({ completed, setCompleted, completedAt, setCompletedAt, activeQuests, setQuestActive, failedQuests, setQuestFailed, profile, updateProfile, questVisibility, showCompletedQuests, showPastEventQuests, storyProgress, updateStoryProgress }: { completed: Set<number>; setCompleted: (value: Set<number>) => void; completedAt: Record<number, number>; setCompletedAt: (value: Record<number, number>) => void; activeQuests: Set<number>; setQuestActive: (questId: number, active: boolean) => void; failedQuests: Set<number>; setQuestFailed: (questId: number) => void; profile: PlayerProfile; updateProfile: (value: PlayerProfile) => void; questVisibility: QuestVisibility; showCompletedQuests: boolean; showPastEventQuests: boolean; storyProgress: StoryProgress; updateStoryProgress: (chapter: string, value: StoryProgress[string]) => void }) {
  const [payload, setPayload] = useState<QuestPayload | null>(null);
  const [selected, setSelected] = useState<QuestRecord | null>(null);
  const [query, setQuery] = useState("");
  const [trader, setTrader] = useState("All traders");
  const [view, setView] = useState<"traders" | "story">("traders");
  const [selectedStoryChapter, setSelectedStoryChapter] = useState<string | null>(null);
  const [ticketEnding, setTicketEnding] = useState<TicketEnding>(() => { const saved = localStorage.getItem(STORY_ENDING_KEY); return saved && saved in ticketEndings ? saved as TicketEnding : "Savior"; });
  const updateTicketEnding = (value: TicketEnding) => { setTicketEnding(value); localStorage.setItem(STORY_ENDING_KEY, value); };
  const [showOriginal, setShowOriginal] = useState(false);
  const [objectiveProgress, setObjectiveProgress] = useState<ObjectiveState>(() => { try { return JSON.parse(localStorage.getItem(OBJECTIVE_PROGRESS_KEY) ?? "{}"); } catch { return {}; } });
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/quests/quests.en.json").then(async (response) => {
      if (!response.ok) throw new Error("저장된 퀘스트 데이터를 읽지 못했습니다.");
      return response.json() as Promise<QuestPayload>;
    }).then(async (data) => {
      const conditionsResponse = await fetch("/quests/quest-conditions.source.json");
      if (!conditionsResponse.ok) return data;
      const conditions = await conditionsResponse.json() as { quests: { id: number; prerequisites: string; requirements: string }[] };
      const conditionsById = new globalThis.Map(conditions.quests.map((condition) => [condition.id, condition]));
      return { ...data, quests: data.quests.map((quest) => {
        const condition = conditionsById.get(quest.id);
        return condition ? { ...quest, wikiPrerequisites: condition.prerequisites, wikiRequirements: condition.requirements } : quest;
      }) };
    }).then((data) => {
      if (!cancelled) {
        setPayload(data);
        setSelected(data.quests[0] ?? null);
      }
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "퀘스트 데이터를 불러오지 못했습니다.");
    });
    return () => { cancelled = true; };
  }, []);

  const visibleQuests = (payload?.quests ?? []).filter((quest) => showPastEventQuests || !isPastEventQuest(quest));
  const traders = traderOrder.filter((name) => visibleQuests.some((quest) => getQuestTrader(quest) === name));
  const filtered = visibleQuests.filter((quest) => {
    const translatedText = quest.sectionsKo?.map((section) => section.text).join(" ") ?? "";
    const matchesSearch = `${quest.title} ${quest.titleKo} ${quest.content} ${translatedText}`.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    const matchesConditions = questVisibility === "all" || (!!payload && questConditionsMet(quest, payload, completed, completedAt, activeQuests, failedQuests, profile, storyProgress));
    return matchesSearch && matchesConditions && (showCompletedQuests || !completed.has(quest.id)) && (trader === "All traders" || getQuestTrader(quest) === trader);
  });
  const updateObjective = (quest: QuestRecord, index: number, value: number, total: number) => {
    const objectives = questObjectives(quest);
    const next: ObjectiveState = { ...objectiveProgress, [quest.id]: [...(objectiveProgress[quest.id] ?? objectives.map(() => 0))] };
    next[quest.id][index] = Math.min(total, Math.max(0, value));
    setObjectiveProgress(next);
    localStorage.setItem(OBJECTIVE_PROGRESS_KEY, JSON.stringify(next));
  };
  const toggleCompleted = (quest: QuestRecord) => {
    const next = new Set(completed);
    const nextCompletedAt = { ...completedAt };
    const repRewards = getQuestTraderReputationRewards(quest);
    const traderRep = { ...profile.traderRep };
    const direction = next.has(quest.id) ? -1 : 1;
    if (direction < 0) { next.delete(quest.id); delete nextCompletedAt[quest.id]; } else { next.add(quest.id); nextCompletedAt[quest.id] = Date.now(); setQuestActive(quest.id, false); }
    for (const [traderName, rep] of repRewards) traderRep[traderName] = Number(((traderRep[traderName] ?? 0) + direction * rep).toFixed(2));
    localStorage.setItem("fieldnote.completedQuests", JSON.stringify([...next]));
    localStorage.setItem(COMPLETED_QUEST_AT_KEY, JSON.stringify(nextCompletedAt));
    setCompleted(next);
    setCompletedAt(nextCompletedAt);
    if (repRewards.length) updateProfile({ ...profile, traderRep });
  };

  return <div className="page-content quest-page">
    <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> QUEST ARCHIVE</div><h1>퀘스트 <em>데이터베이스</em></h1><p>영문 위키 원문을 기준으로 합니다. 게임 내 한국어 문구와 일치하는 제목·목표에만 번역을 적용하며 나머지는 원문을 보존합니다.</p></div><span className="tag">{payload ? `${payload.quests.length} QUEST PAGES` : "SYNCING"}</span></div>
    <div className="quest-toolbar">
      <label className="quest-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="퀘스트 이름 또는 내용 검색" /></label>
      <button type="button" className={`quest-mode-tab ${view === "traders" ? "active" : ""}`} onClick={() => { setView("traders"); setSelectedStoryChapter(null); }}>상인 임무</button><button type="button" className={`quest-mode-tab ${view === "story" ? "active" : ""}`} onClick={() => setView("story")}>주요 임무</button>
      <span>{filtered.length}개 표시 · {completed.size}개 완료</span>
    </div>
    {view === "traders" && <nav className="trader-carousel" aria-label="상인 선택"><button type="button" className={`trader-carousel-card ${trader === "All traders" ? "active" : ""}`} onClick={() => setTrader("All traders")}><span className="trader-portrait all-traders">ALL</span><b>전체 상인</b></button>{traders.map((name) => <button type="button" key={name} className={`trader-carousel-card ${trader === name ? "active" : ""}`} onClick={() => setTrader(name)}><img className="trader-portrait" src={`/images/traders/${traderPortraitSlug[name] ?? name.toLowerCase()}.webp`} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><b>{toKoreanTrader(name)}</b><small>{traderLevelLabel(name, profile)} · {(payload?.quests ?? []).filter((quest) => getQuestTrader(quest) === name).length} 임무</small></button>)}</nav>}
    {error ? <div className="quest-error">{error}</div> : !payload ? <div className="quest-loading">위키 퀘스트 데이터를 불러오는 중…</div> : view === "story" ? <section className={`story-layout ${selectedStoryChapter ? "is-selected" : ""}`}>
      {!selectedStoryChapter ? <><header className="story-layout-heading"><span className="eyebrow">MAIN STORY</span><h2>주요 임무 챕터</h2><p>챕터를 선택하면 상세 설명을 확인할 수 있습니다.</p></header><div className="story-chapter-grid">{mainStoryChapters.map((chapter, index) => <button type="button" key={chapter.title} className="story-chapter-card" onClick={() => setSelectedStoryChapter(chapter.title)}><BookOpen size={24} /><span>{String(index + 1).padStart(2, "0")}</span><strong>{chapter.title}</strong></button>)}</div></> : <><nav className="story-icon-rail" aria-label="주요 임무 선택"><button type="button" className="story-back" aria-label="챕터 목록으로 돌아가기" title="챕터 목록" onClick={() => setSelectedStoryChapter(null)}>‹</button>{mainStoryChapters.map((chapter) => <button type="button" key={chapter.title} className={`story-icon-button ${selectedStoryChapter === chapter.title ? "active" : ""}`} aria-label={chapter.title} title={chapter.title} onClick={() => setSelectedStoryChapter(chapter.title)}><BookOpen size={21} /></button>)}</nav><article className="story-chapter-detail">{(() => { const chapter = mainStoryChapters.find((item) => item.title === selectedStoryChapter)!; return <><div><span className="eyebrow">MAIN STORY CHAPTER</span><h2>{chapter.title}</h2></div><p>{chapter.description}</p><StoryChapterInfo chapter={chapter.title} />{selectedStoryChapter === "The Ticket" && <TicketEndingPanel ending={ticketEnding} onChange={updateTicketEnding} />}<label className="story-progress-control">챕터 진행 상태<select value={storyProgress[chapter.title] ?? "not-started"} onChange={(event) => updateStoryProgress(chapter.title, event.target.value as StoryProgress[string])}><option value="not-started">시작 전</option><option value="active">진행 중</option><option value="completed">완료</option></select></label><a href={storyChapterWiki[chapter.title] ?? chapter.url} target="_blank" rel="noreferrer" onClick={(event) => { if (isTauri()) { event.preventDefault(); void openUrl(storyChapterWiki[chapter.title] ?? chapter.url).catch((reason) => console.error("Failed to open story wiki page", reason)); } }}>영문 위키에서 보기 ↗</a></>; })()}</article></>}
    </section> : <section className="quest-browser">
      <div className="quest-list" aria-label="평판 단계별 퀘스트 목록">{[0, 1, 2, 3, 4].map((level) => { const levelQuests = filtered.filter((quest) => (explicitTraderLevel(quest) ?? 0) === level); if (!levelQuests.length) return null; return <div className="quest-level-group" key={level}><h3>{level ? `LL${level}` : "평판 조건 미표기"}<small>{levelQuests.length}개 임무</small></h3>{levelQuests.map((quest) => <button type="button" key={quest.id} onClick={() => setSelected(quest)} className={`quest-list-item ${selected?.id === quest.id ? "selected" : ""} ${completed.has(quest.id) ? "completed" : ""}`}>
        <span className="quest-list-check">{completed.has(quest.id) ? "✓" : ""}</span><span className="quest-list-copy"><strong>{getQuestTitle(quest)}</strong><small>{toKoreanTrader(getQuestTrader(quest))} · {quest.objectivesKo[0] ?? getQuestSections(quest.content).find((section) => section.title.toLowerCase() === "objectives")?.text.split("\n")[0] ?? "상세 정보 보기"}</small></span><span className="quest-chevron">›</span>
      </button>)}</div>; })}{filtered.length === 0 && <p className="quest-empty">검색 결과가 없습니다.</p>}</div>
      <article className="quest-detail">{selected ? <>
      <div className="quest-detail-top"><div><span className="eyebrow">{toKoreanTrader(getQuestTrader(selected)).toUpperCase()} · WIKI QUEST</span><h2>{showOriginal ? selected.title : getQuestTitle(selected)}</h2><div className="quest-tags">{selected.map && <span>{toKoreanMap(selected.map)}</span>}{selected.kappa && <span>카파 필수</span>}{(getQuestPrerequisites(selected) || getQuestRequirements(selected)) && <span className="quest-condition-tag">조건: {questConditionLabel(selected, payload?.quests ?? [])}</span>}{selected.unlocks && <span>해금: {getQuestTitle(payload?.quests.find((quest) => quest.title === selected.unlocks) ?? { ...selected, title: selected.unlocks, titleKo: "" })}</span>}</div>{isQuestAvailableInMode(selected, "PVE") !== isQuestAvailableInMode(selected, "PVP") && <p className="quest-mode-unavailable">{isQuestAvailableInMode(selected, "PVE") ? "PvE 전용 퀘스트" : "PvP 전용 퀘스트"}{!isQuestAvailableInMode(selected, profile.prestigeMode) ? " · 현재 모드에서 수락할 수 없음" : ""}</p>}</div><div className="quest-detail-actions"><button type="button" disabled={!isQuestAvailableInMode(selected, profile.prestigeMode)} className={`quest-active-toggle ${activeQuests.has(selected.id) ? "is-active" : ""}`} aria-pressed={activeQuests.has(selected.id)} onClick={() => setQuestActive(selected.id, !activeQuests.has(selected.id))}>{activeQuests.has(selected.id) ? "\uC9C4\uD589 \uD574\uC81C" : "\uC9C4\uD589 \uD45C\uC2DC"}</button><button type="button" className="quest-view-toggle" aria-pressed={showOriginal} onClick={() => setShowOriginal((value) => !value)}>{showOriginal ? "번역 보기" : "원문 보기"}</button><button type="button" disabled={!isQuestAvailableInMode(selected, profile.prestigeMode)} className={`quest-complete ${completed.has(selected.id) ? "is-complete" : ""}`} onClick={() => toggleCompleted(selected)}>{completed.has(selected.id) ? "완료됨 ✓" : "완료 표시"}</button><button type="button" className="quest-failed-toggle" aria-pressed={failedQuests.has(selected.id)} onClick={() => setQuestFailed(selected.id)}>{failedQuests.has(selected.id) ? "실패 기록 해제" : "실패 기록"}</button></div></div>
        <div className="quest-sections">{getQuestSections(selected.content).filter((section) => ["dialogue", "objectives", "rewards"].includes(section.title.toLowerCase())).map((section) => {
          const translatedSection = selected.sectionsKo?.find((item) => item.title === section.title);
          const heading = translatedSection?.titleKo ?? ({ Dialogue: "대화", Requirements: "요구 조건", Objectives: "목표", Rewards: "보상", Guide: "공략", "Failure Penalty": "실패 시 불이익", "Failure Dialogue": "실패 대사", "See also": "관련 문서" } as Record<string, string>)[section.title] ?? section.title;
          const text = showOriginal || !translatedSection ? section.text : normalizeKoreanSpacing(translatedSection.text);
          const sourceLabel = translatedSection?.translationSource === "Tarkov.dev game localization" ? "게임 한국어" : translatedSection ? "영문 기반 번역" : "영문 원문";
          if (section.title.toLowerCase() === "objectives") { const objectives = questObjectives(selected, showOriginal); const values = objectiveProgress[selected.id] ?? objectives.map(() => 0); const done = objectives.filter((objective, index) => values[index] >= objective.total).length; return <section key={section.title}><h3>{heading}<small>{done}/{objectives.length} 완료</small></h3><div className="quest-objectives">{objectives.map((objective, index) => { const current = values[index] ?? 0; const checked = current >= objective.total; return <div className={`quest-objective ${checked ? "complete" : ""}`} key={`${selected.id}-${index}`}><input type="checkbox" checked={checked} aria-label={`${objective.text} 완료`} onChange={(event) => updateObjective(selected, index, event.target.checked ? objective.total : 0, objective.total)} /><span>{objective.text}</span>{objective.total > 1 ? <div className="objective-counter"><button type="button" aria-label="진행도 감소" onClick={() => updateObjective(selected, index, current - 1, objective.total)}><Minus size={13} /></button><input type="number" min={0} max={objective.total} value={current} aria-label="현재 진행 수" onChange={(event) => updateObjective(selected, index, Number(event.target.value) || 0, objective.total)} /><b>/ {objective.total}</b><button type="button" aria-label="진행도 증가" onClick={() => updateObjective(selected, index, current + 1, objective.total)}><Plus size={13} /></button></div> : null}</div>; })}</div></section>; }
          return <section key={section.title}><h3>{heading}<small className={translatedSection ? "quest-translation-mark" : "quest-source-mark"}>{sourceLabel}</small></h3><div>{text.split("\n").map((line, index) => line.trim() ? <p key={`${section.title}-${index}`}>{line.trim()}</p> : null)}</div></section>;
        })}</div>
        <a className="quest-source" href={selected.url} target="_blank" rel="noreferrer" onClick={(event) => { if (isTauri()) { event.preventDefault(); void openUrl(selected.url).catch((reason) => console.error("Failed to open quest wiki page", reason)); } }}>영문 위키 보기 ↗</a>
      </> : <p className="quest-empty">왼쪽 목록에서 퀘스트를 선택하세요.</p>}</article>
    </section>}
    {payload && <footer className="quest-license"><span>{payload.attribution} 퀘스트 정보는 영문 원문을 바탕으로 번역했습니다.</span><span><a href={payload.sourceUrl} target="_blank" rel="noreferrer">위키 분류 페이지 ↗</a> · <a href={payload.terminologySourceUrl} target="_blank" rel="noreferrer">게임 용어 출처 ↗</a>{payload.contentTranslationUrl && <> · <a href={payload.contentTranslationUrl} target="_blank" rel="noreferrer">번역 도구 ↗</a></>} · <a href={payload.licenseUrl} target="_blank" rel="noreferrer">{payload.license} ↗</a></span></footer>}
  </div>;
}

function HomePage({ playerName, onMapSelection, onQuestSelection }: { playerName: string; onMapSelection: () => void; onQuestSelection: () => void }) {
  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> OPERATIVE DASHBOARD</div><h1>좋은 아침입니다, <em>{playerName}</em></h1><p>오늘의 타르코프 작전을 준비하세요.</p></div><button className="date-pill">2026년 11월 24일 <span>화요일</span></button></div>
    <section className="hero-card"><div className="hero-noise" /><div className="hero-copy"><div className="hero-kicker"><span className="tag">DEPLOYMENT STATUS</span><span className="status-dot" /> 작전 준비 완료</div><h2>다음 레이드를<br /><em>계획해 보세요.</em></h2><p>장비를 확인하고, 목표를 설정하고, 안전하게 귀환하세요.</p><button className="primary-button" onClick={onMapSelection}>맵 선택 <span>↗</span></button></div><div className="hero-graphic"><div className="scope-ring ring-one" /><div className="scope-ring ring-two" /><div className="scope-cross horizontal" /><div className="scope-cross vertical" /><div className="scope-center"><Crosshair size={44} strokeWidth={1} /></div><span className="coord coord-a">37° 42′ N</span><span className="coord coord-b">59° 11′ E</span><span className="map-label">TERRAGROUP<br />RESTRICTED AREA</span></div><div className="hero-index">ZONE <b>01</b></div></section>
    <div className="section-title"><div><span className="section-index">01</span><h2>작전 현황</h2></div><span>OPERATIONS OVERVIEW</span></div>
    <section className="stats-grid"><StatCard icon={Activity} label="생존율" value="64" suffix="%" note="지난 30회 레이드" trend="+4.2%" /><StatCard icon={Crosshair} label="K/D 비율" value="3.8" suffix="" note="PMC 기준" trend="+0.3" /><StatCard icon={Wallet} label="보유 루블" value="2.45" suffix="M" note="₽ 루블" trend="잔액" /><StatCard icon={Shield} label="PMC 레벨" value="24" suffix="" note="다음 레벨까지 12,400 XP" trend="LV.24" /></section>
    <div className="lower-grid"><section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">FIELD REPORT</span><h3>최근 레이드</h3></div><button className="text-button">전체 기록 <span>→</span></button></div><div className="raid-row"><div className="raid-map customs"><span>C</span></div><div className="raid-info"><strong>커스텀</strong><span>오늘 14:32 · PMC · 28분</span></div><span className="raid-result survived"><i /> 생존</span><span className="raid-loot">₽ 184,200</span></div><div className="raid-row"><div className="raid-map woods"><span>W</span></div><div className="raid-info"><strong>우드</strong><span>어제 21:08 · PMC · 16분</span></div><span className="raid-result killed"><i /> 사망</span><span className="raid-loot dim">₽ 42,800</span></div><div className="raid-row"><div className="raid-map factory"><span>F</span></div><div className="raid-info"><strong>팩토리</strong><span>어제 19:45 · PMC · 11분</span></div><span className="raid-result survived"><i /> 생존</span><span className="raid-loot">₽ 96,500</span></div></section>
      <section className="panel tasks-panel"><div className="panel-heading"><div><span className="eyebrow">ACTIVE OBJECTIVES</span><h3>진행 중인 퀘스트</h3></div><BookOpen size={18} className="panel-icon" /></div><div className="task-item"><span className="task-check" /><div><strong>건스미스 - 파트 3</strong><small>필요한 무기 개조품을 찾아보세요.</small><div className="task-progress"><i style={{ width: "62%" }} /></div></div><b>2/3</b></div><div className="task-item"><span className="task-check done">✓</span><div><strong>쇼어라인 정찰</strong><small>리조트 서관에서 정보를 수집하세요.</small><div className="task-progress"><i style={{ width: "34%" }} /></div></div><b>1/3</b></div><button className="task-footer" onClick={onQuestSelection}>퀘스트 목록 보기 <span>→</span></button></section></div>
    <footer className="page-footer"><span>FIELDNOTE INTELLIGENCE SYSTEM</span><span>모든 작전 데이터는 이 기기에 저장됩니다.</span></footer>
  </div>;
}

function StatCard({ icon: Icon, label, value, suffix, note, trend }: { icon: typeof Activity; label: string; value: string; suffix: string; note: string; trend: string }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><Icon size={17} /></div><div className="stat-value">{value}<small>{suffix}</small></div><div className="stat-bottom"><span>{note}</span><b>{trend}</b></div></article>;
}

type TraderThreshold = { level: number; rep: number; sales: number };
const traderThresholds: Record<string, TraderThreshold[]> = Object.fromEntries(Object.entries(traderLoyaltyWiki.levels).map(([name, trader]) => [name, trader.levels]));
const traderSalesCurrency: Record<string, string> = Object.fromEntries(Object.entries(traderLoyaltyWiki.levels).filter(([name]) => !["Fence", "Ref"].includes(name)).map(([name, trader]) => [name, trader.currency]));
function traderLevel(trader: string, rep: number, playerLevel: number, sales: number): number | null {
  if (trader === "BTR Driver" || trader === "Lightkeeper") return null;
  if (trader === "Fence") return rep >= 6 ? 4 : 1;
  const thresholds = traderThresholds[trader] ?? [];
  let current = 1;
  thresholds.forEach((threshold, index) => {
    if (playerLevel >= threshold.level && rep >= threshold.rep && sales >= threshold.sales) current = index + 2;
  });
  return current;
}
function traderLevelLabel(trader: string, profile: PlayerProfile) {
  const level = traderLevel(trader, profile.traderRep[trader] ?? 0, profile.level, profile.traderSales[trader] ?? 0);
  return level === null ? "특수 상인" : `LL${level}`;
}

const traderOrder = ["Prapor", "Therapist", "Fence", "Skier", "Peacekeeper", "Mechanic", "Ragman", "Jaeger", "Ref", "BTR Driver", "Lightkeeper"];

type PrestigeRequirement = { level: number; skills: Record<string, number>; hideout: Record<string, number>; checks: string[] };
const prestigeCheckNames: Record<string, string> = { newBeginning: "Ragman 퀘스트: New Beginning", tour: "스토리 챕터: Tour", fallingSkies: "퀘스트/스토리: Falling Skies", ticketFromTarkov: "스토리 챕터: Obtain the Ticket from Tarkov", collector: "퀘스트: Collector", theyAreAlreadyHere: "스토리 챕터: They Are Already Here", theTicket: "스토리 챕터: The Ticket" };
function getPrestigeRequirement(mode: "PVP" | "PVE", stage: number): PrestigeRequirement {
  const requirements: PrestigeRequirement[] = [];
  for (let current = 1; current <= 6; current++) {
    const level = current === 1 ? mode === "PVE" ? 15 : 25 : current === 2 ? mode === "PVE" ? 25 : 30 : current === 3 ? 35 : current === 4 ? 40 : 47;
    const skills: Record<string, number> = current === 1 ? {} : current <= 3 ? { strength: 10, endurance: 10, charisma: 7 } : current === 4 ? { strength: 15, endurance: 15, charisma: 12 } : { strength: 20, endurance: 20, charisma: 20 };
    const hideout: Record<string, number> = current === 1 && mode === "PVE" ? {} : current <= 4 ? { intelligence_center: 1, nutrition_unit: 2, rest_space: 2 } : { intelligence_center: 2, security: 3, rest_space: 3 };
    let checks: string[] = [];
    if (current === 1) checks = mode === "PVP" ? ["newBeginning"] : [];
    if (current === 2) checks = ["newBeginning", "tour"];
    if (current === 3) checks = ["newBeginning", "tour", "fallingSkies"];
    if (current === 4) checks = ["newBeginning", "tour", "ticketFromTarkov"];
    if (current === 5) checks = ["newBeginning", "tour", "collector", "theyAreAlreadyHere", "ticketFromTarkov"];
    if (current === 6) checks = ["newBeginning", "collector", "theTicket"];
    requirements.push({ level, skills, hideout, checks });
  }
  return requirements[stage - 1] ?? requirements[5];
}

function SkillsPage({ profile, updateProfile }: { profile: PlayerProfile; updateProfile: (value: PlayerProfile) => void }) {
  const [masteryName, setMasteryName] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<(typeof skillCatalog)[number] | null>(null);
  const updateSkill = (id: string, level: number) => updateProfile({ ...profile, skills: { ...profile.skills, [id]: Math.min(51, Math.max(0, level)) } });
  const updateMastery = (id: string, level: number) => updateProfile({ ...profile, weaponMastery: { ...profile.weaponMastery, [id]: Math.min(3, Math.max(0, level)) } });
  const groups = ["Physical", "Combat", "Practical", "Mental", "Other"];
  return <div className="page-content skills-page"><div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> OPERATIVE SKILLS</div><h1>캐릭터 <em>스킬</em></h1><p>스킬 레벨은 0~51로 기록하며, 51은 화면에서 마스터로 표시합니다. 데이터는 SQLite와 이 기기에 저장됩니다.</p></div><span className="tag">{skillCatalog.length} SKILLS</span></div>
    {groups.map((group) => <section className={`panel skill-group ${group === "Other" ? "supplemental-skills" : ""}`} key={group}><div className="panel-heading"><div><span className="eyebrow">{group.toUpperCase()}</span><h3>{group === "Physical" ? "신체" : group === "Mental" ? "정신" : group === "Combat" ? "전투" : group === "Practical" ? "실용" : "추가 API 데이터"} 스킬</h3>{group === "Other" && <p className="field-hint">현재 인게임 스킬 목록에는 없는 Tarkov.dev 기술 데이터입니다.</p>}</div></div><div className="skill-grid">{skillCatalog.filter((skill) => skill.category === group).map((skill) => { const level = profile.skills[skill.id] ?? 0; return <div className="skill-card" key={skill.id}><button type="button" className="skill-card-info" onClick={() => setSelectedSkill(skill)}><img src={skillIconPath(skill)} alt="" loading="lazy" /><span>{skill.name}</span><b>{level === 51 ? "마스터" : level}</b></button><input aria-label={`${skill.name} 스킬 레벨`} type="number" min={0} max={51} value={level} onChange={(event) => updateSkill(skill.id, Number(event.target.value) || 0)} /></div>; })}</div></section>)}
    <section className="panel skill-group"><div className="panel-heading"><div><span className="eyebrow">WEAPON MASTERY</span><h3>무기 숙련도</h3></div></div><p className="field-hint">무기별 숙련도는 0~3으로 기록합니다. 목록 이름은 인게임 표기를 입력하세요.</p><div className="mastery-add"><input value={masteryName} placeholder="예: AK-74" onChange={(event) => setMasteryName(event.target.value)} /><button type="button" onClick={() => { const name = masteryName.trim(); if (name && !(name in profile.weaponMastery)) updateMastery(name, 0); setMasteryName(""); }}>무기 추가</button></div><div className="mastery-list">{Object.entries(profile.weaponMastery).sort(([a], [b]) => a.localeCompare(b)).map(([weapon, level]) => <label key={weapon}><span>{weapon}</span><input aria-label={`${weapon} 숙련도`} type="number" min={0} max={3} value={level} onChange={(event) => updateMastery(weapon, Number(event.target.value) || 0)} /><button type="button" aria-label={`${weapon} 제거`} onClick={() => { const next = { ...profile.weaponMastery }; delete next[weapon]; updateProfile({ ...profile, weaponMastery: next }); }}>×</button></label>)}</div></section>
    {selectedSkill && (() => { const level = profile.skills[selectedSkill.id] ?? 0; const detail = getSkillDetails(selectedSkill); return <div className="skill-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSkill(null); }}><section className="skill-modal" role="dialog" aria-modal="true" aria-labelledby="skill-modal-title"><button type="button" className="skill-modal-close" aria-label="닫기" onClick={() => setSelectedSkill(null)}>×</button><header><img src={skillIconPath(selectedSkill)} alt="" /><div><span className="eyebrow">{selectedSkill.category.toUpperCase()} SKILL</span><h2 id="skill-modal-title">{selectedSkill.name}</h2><p>현재 레벨 {level === 51 ? "마스터" : level} / 51</p></div></header><section><span className="eyebrow">CURRENT LEVEL EFFECT</span><h3>현재 레벨 효과</h3><p>{detail.atLevel ? detail.atLevel(level) : detail.effect}</p></section><section><span className="eyebrow">NEXT LEVEL</span><h3>다음 레벨 효과</h3><p>{level >= 51 ? "이미 최대 레벨입니다." : `레벨 ${level + 1}에서 적용되는 효과입니다. ${detail.atLevel ? detail.atLevel(Math.min(level + 1, 51)) : detail.effect}`}</p></section><section><span className="eyebrow">ELITE BONUS</span><h3>마스터 효과</h3><p>{detail.elite}</p></section><section><span className="eyebrow">HOW TO LEVEL</span><h3>스킬 획득 방법</h3><p>{detail.train}</p></section><a href={skillWikiUrl(selectedSkill)} target="_blank" rel="noreferrer">공식 위키에서 자세히 보기 ↗</a></section></div>; })()}
  </div>;
}

function ProfilePage({ profile, updateProfile, completedQuests, setCompletedQuests, setCompletedAt, resetProfile }: { profile: PlayerProfile; updateProfile: (value: PlayerProfile) => void; completedQuests: Set<number>; setCompletedQuests: (value: Set<number>) => void; setCompletedAt: (value: Record<number, number>) => void; resetProfile: () => void }) {
  const setPlayerName = (name: string) => updateProfile({ ...profile, name });
  const updateRep = (trader: string, value: number) => updateProfile({ ...profile, traderRep: { ...profile.traderRep, [trader]: value } });
  const updateSales = (trader: string, value: number) => updateProfile({ ...profile, traderSales: { ...profile.traderSales, [trader]: Math.max(0, value) } });
  const xpProgress = getPlayerExperienceProgress(profile.experience);
  return <div className="page-content profile-page"><div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> OPERATIVE DOSSIER</div><h1>오퍼레이터 <em>프로필</em></h1><p>PMC 레벨, 프레스티지, 상인 평판과 퀘스트 진행 상황을 관리합니다.</p></div><button className="reset-profile" onClick={() => { if (window.confirm("퀘스트 완료와 목표 진행도, 스토리 진행 상태, 레벨, 스킬, 상인 평판, 은신처와 루블을 초기화할까요? 프레스티지 단계는 유지됩니다.")) resetProfile(); }}>프로필 초기화</button></div>
    <section className="profile-banner"><div className="profile-emblem"><Shield size={52} strokeWidth={1.2} /><span>U</span></div><div className="profile-identity"><span className="eyebrow">UNITED SECURITY</span><h2>{profile.name}</h2><p>민간 군사 기업 오퍼레이터 <span>·</span> 등록일 2026.06.14</p></div><span className="level-badge">LVL <b>{profile.level}</b></span><span className="level-badge">PRESTIGE <b>{profile.prestige}</b></span></section>
    <div className="profile-columns"><section className="panel profile-details"><div className="panel-heading"><div><span className="eyebrow">PERSONAL DATA</span><h3>기본 정보</h3></div><UserRound size={18} className="panel-icon" /></div><label className="form-label">오퍼레이터 호출명</label><div className="input-wrap"><input value={profile.name} maxLength={20} onChange={(event) => setPlayerName(event.target.value)} /><span>{profile.name.length}/20</span></div><p className="field-hint">변경 사항은 자동 저장됩니다.</p><div className="profile-input-row"><label>PMC 레벨<output>{profile.level}</output></label><label>프레스티지 단계<output>{profile.prestige} / 6</output></label></div><div className="profile-xp"><div className="profile-xp-heading"><strong>누적 경험치</strong><b>{profile.experience.toLocaleString()} XP</b></div><div className="profile-xp-track" role="progressbar" aria-label="다음 레벨 경험치 진행도" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(xpProgress.progress * 100)}><span style={{ width: `${xpProgress.progress * 100}%` }} /></div><p className="field-hint">{profile.level === 79 ? "최고 레벨입니다." : `${xpProgress.experienceIntoLevel.toLocaleString()} / ${(xpProgress.nextLevelExperience - xpProgress.currentLevelExperience).toLocaleString()} XP · 다음 레벨까지 ${xpProgress.experienceToNextLevel.toLocaleString()} XP`}</p><label>경험치 입력<input type="number" min={0} max={MAX_PLAYER_EXPERIENCE} step={1} value={profile.experience} onChange={(event) => { const value = Math.min(MAX_PLAYER_EXPERIENCE, Math.max(0, Math.floor(Number(event.target.value) || 0))); updateProfile({ ...profile, experience: value, level: playerLevelForExperience(value) }); }} /></label></div><div className="detail-divider" /><div className="detail-line"><span>진영</span><b><i className="faction-dot" /> USEC</b></div><div className="detail-line"><span>완료 퀘스트</span><b>{completedQuests.size}개</b></div><p className="field-hint">영문 위키 기준으로 PMC 레벨, 상인 평판, 누적 거래액을 함께 계산합니다.</p></section>
      <section className="panel profile-traders"><div className="panel-heading"><div><span className="eyebrow">LOYALTY LEVELS</span><h3>상인 평판 및 등급</h3></div><Users size={18} className="panel-icon" /></div><div className="trader-table">{traderOrder.map((trader) => { const rep = profile.traderRep[trader] ?? 0; const levels = traderThresholds[trader] ?? []; const current = traderLevel(trader, rep, profile.level, profile.traderSales[trader] ?? 0); const next = current === null ? undefined : levels[current - 1]; const condition = trader === "Fence" ? "스캐브 카르마 6.00 필요" : trader === "Lightkeeper" ? "평판은 거래 등급에 사용되지 않음" : trader === "BTR Driver" ? "일반 등급 없음 · Savior 엔딩은 0.40 필요" : next ? "다음 LL 조건: 레벨 " + next.level + " · 평판 " + next.rep.toFixed(2) + (traderSalesCurrency[trader] ? " · 거래액 " + next.sales.toLocaleString() + " " + traderSalesCurrency[trader] : "") : "최고 등급"; return <div className="trader-row" key={trader}><div className="trader-name"><strong>{toKoreanTrader(trader)} <span>{current === null ? "N/A" : "LL" + current}</span></strong><small>{condition}{trader === "Fence" ? " · 평판은 스캐브 카르마와 연동" : ""}</small></div><label>평판<input aria-label={`${toKoreanTrader(trader)} 평판`} type="number" step="0.01" value={rep} onChange={(event) => updateRep(trader, Number(event.target.value) || 0)} /></label>{traderSalesCurrency[trader] && (<label>누적 거래액 (${traderSalesCurrency[trader] ?? "₽"})<input aria-label={"Sales for " + trader} type="number" min={0} step={1000} value={profile.traderSales[trader] ?? 0} onChange={(event) => updateSales(trader, Number(event.target.value) || 0)} /></label>)}</div>; })}</div><p className="field-hint">영문 위키의 상인별 평판·레벨·거래액 기준을 적용합니다. Fence 평판은 스캐브 카르마입니다.</p></section></div>
    <PrestigePanel profile={profile} updateProfile={updateProfile} setCompletedQuests={setCompletedQuests} setCompletedAt={setCompletedAt} />
    <footer className="page-footer"><span>FIELDNOTE INTELLIGENCE SYSTEM</span><span>프로필과 상인 평판은 이 기기에 저장됩니다.</span></footer></div>;
}

function PrestigePanel({ profile, updateProfile, setCompletedQuests, setCompletedAt }: { profile: PlayerProfile; updateProfile: (value: PlayerProfile) => void; setCompletedQuests: (value: Set<number>) => void; setCompletedAt: (value: Record<number, number>) => void }) {
  const stage = profile.prestige < 6 ? profile.prestige + 1 : 7;
  const activeStage = Math.min(stage, 6);
  const req = getPrestigeRequirement(profile.prestigeMode, activeStage);
  const retained = profile.prestigeMode === "PVE" ? [10, 20, 30, 40, 50, 50][activeStage - 1] : [5, 10, 15, 20, 25, 30][activeStage - 1];
  const checks: { key: string; label: string; complete: boolean; hideoutId?: string; manualKey?: string }[] = [
    { key: "level", label: `PMC 레벨 ${req.level}`, complete: profile.level >= req.level },
    ...Object.entries(req.skills).map(([id, level]) => ({ key: `skill:${id}`, label: `${skillCatalog.find((skill) => skill.id === id)?.name ?? id} ${level}`, complete: (profile.skills[id] ?? 0) >= level })),
    ...Object.entries(req.hideout).map(([id, level]) => ({ key: `hideout:${id}`, hideoutId: id, label: `${id.replaceAll("_", " ")} ${level}단계`, complete: (profile.hideout[id] ?? 0) >= level })),
    ...req.checks.map((key) => ({ key: `manual:${key}`, manualKey: key, label: prestigeCheckNames[key], complete: profile.prestigeChecks[`${stage}.${key}`] === true })),
  ];
  const ready = stage <= 6 && checks.every((check) => check.complete);
  const setCheck = (key: string, value: boolean) => updateProfile({ ...profile, prestigeChecks: { ...profile.prestigeChecks, [`${stage}.${key}`]: value } });
  const prestige = () => {
    if (!ready || !window.confirm(`프레스티지 ${stage} 승급을 실행할까요? 퀘스트, 상인 평판, PMC 레벨, 루블, 은신처는 초기화되고 스킬과 무기 숙련도의 ${retained}%만 유지됩니다.`)) return;
    const skills = Object.fromEntries(Object.entries(profile.skills).map(([id, level]) => [id, Math.floor(level * retained / 100)]));
    const charismaId = "charisma";
    skills[charismaId] = Math.min(51, (skills[charismaId] ?? 0) + 1);
    const weaponMastery = Object.fromEntries(Object.entries(profile.weaponMastery).map(([key, level]) => [key, Math.floor(level * retained / 100)]));
    updateProfile({ ...profile, level: 1, experience: 0, prestige: stage, traderRep: {}, traderSales: {}, skills, weaponMastery, stashRoubles: 0, hideout: {}, prestigeChecks: {} });
    setCompletedQuests(new Set());
    localStorage.setItem("fieldnote.completedQuests", "[]");
    setCompletedAt({});
    localStorage.setItem(COMPLETED_QUEST_AT_KEY, "{}");
  };
  return <section className="panel prestige-panel"><div className="panel-heading"><div><span className="eyebrow">PRESTIGE PROGRESSION</span><h3>프레스티지 {stage <= 6 ? `${stage} 승급 조건` : "최고 단계"}</h3></div><span className="tag">현재 {profile.prestige} 단계</span></div>
    <div className="prestige-config"><label>게임 모드<select value={profile.prestigeMode} onChange={(event) => updateProfile({ ...profile, prestigeMode: event.target.value as "PVP" | "PVE" })}><option value="PVE">PvE</option><option value="PVP">PvP</option></select></label><span>루블 조건은 승급 요건에서 제외 · 승급 후 스킬·무기 숙련도 유지: {retained}% · 카리스마 +1</span></div>
    <div className="prestige-checklist">{checks.map((check) => <div className={`prestige-check ${check.complete ? "complete" : ""}`} key={check.key}><span>{check.complete ? "✓" : "○"}</span><strong>{check.label}</strong>{check.hideoutId && <input type="number" min={0} max={3} aria-label={check.label} value={profile.hideout[check.hideoutId] ?? 0} onChange={(event) => updateProfile({ ...profile, hideout: { ...profile.hideout, [check.hideoutId!]: Number(event.target.value) || 0 } })} />}{check.manualKey && <input type="checkbox" checked={check.complete} onChange={(event) => setCheck(check.manualKey!, event.target.checked)} />}</div>)}</div>
    {stage <= 6 ? <button className="prestige-button" disabled={!ready} onClick={prestige}>{ready ? `프레스티지 ${stage} 실행` : `조건 ${checks.filter((check) => check.complete).length} / ${checks.length} 충족`}</button> : <p className="field-hint">모든 프레스티지 단계를 완료했습니다.</p>}
    <p className="field-hint">승급하면 PMC 레벨·퀘스트·상인 평판·은신처·루블을 초기화하고, 해당 단계의 유지 비율만큼 스킬과 웨폰 마스터링을 남깁니다.</p>
  </section>;
}
type InjectorRecord = { id: string; name: string; normalizedName: string; icon: string; wikiLink: string; useTime: number; cures: string[]; effects: { type: string; skill?: string; value: number; percent: boolean; duration: number; delay: number; chance: number }[] };

function InjectorsPage() {
  const [injectors, setInjectors] = useState<InjectorRecord[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => { fetch("/injectors.json").then((response) => response.json()).then(setInjectors).catch(() => setInjectors([])); }, []);
  const filtered = injectors.filter((item) => `${item.name} ${item.normalizedName}`.toLowerCase().includes(query.toLowerCase()));
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const effectName = (effect: InjectorRecord["effects"][number]) => {
    const names: Record<string, string> = { HealthRate: "체력 회복", EnergyRate: "에너지 회복", HydrationRate: "수분 회복", MaxStamina: "최대 스태미나", StaminaRate: "스태미나 회복", WeightLimit: "무게 한도", HandsTremor: "손 떨림", QuantumTunnelling: "양자 터널링", BodyTemperature: "체온", Pain: "진통", Antidote: "해독", Removeallbloodlosses: "출혈 제거", Skill: `${({ Endurance: "지구력", Strength: "근력", Attention: "주의력", Perception: "탐색력", Metabolism: "대사", Health: "건강", Vitality: "활력", Immunity: "면역", StressResistance: "스트레스 저항" } as Record<string, string>)[effect.skill ?? ""] ?? effect.skill ?? "스킬"}` };
    return names[effect.type] ?? effect.type;
  };
  return <section className="page-content injector-page"><header className="page-heading"><div><span className="eyebrow">FIELD MEDICINE / STIMULANTS</span><h1>주사기 정보</h1><p>주사기별 지속 시간과 주요 효과를 확인합니다.</p></div><label className="injector-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="주사기 검색" /></label></header>
    <div className="injector-layout"><div className="injector-grid">{filtered.map((item) => <button key={item.id} className={`injector-card ${selected?.id === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}><img src={item.icon} alt="" /><span><small>INJECTOR</small><strong>{item.name}</strong><em>효과 {item.effects.length}개 · 사용 {item.useTime}초</em></span></button>)}{filtered.length === 0 && <div className="injector-empty">검색 결과가 없습니다.</div>}</div>
      {selected && <aside className="injector-detail"><div className="injector-detail-head"><img src={selected.icon} alt="" /><div><span className="eyebrow">INJECTOR PROFILE</span><h2>{selected.name}</h2><small>사용 시간 {selected.useTime}초</small></div></div>{selected.cures.length > 0 && <div className="injector-cures"><span className="eyebrow">치료 효과</span><p>{selected.cures.map((cure) => ({ Pain: "통증", Contusion: "타박상", LightBleeding: "경출혈", HeavyBleeding: "중출혈", Intoxication: "중독" } as Record<string, string>)[cure] ?? cure).join(" · ")}</p></div>}<div className="injector-effects"><span className="eyebrow">효과 및 지속 시간</span>{selected.effects.map((effect, index) => <div className="injector-effect" key={`${effect.type}-${effect.skill ?? ""}-${index}`}><span>{effectName(effect)}<small>{effect.delay > 0 ? `${effect.delay}초 후 · ` : ""}{effect.duration}초</small></span><b>{effect.type === "Skill" ? "+" : effect.value > 0 ? "+" : ""}{effect.value}{effect.percent ? "%" : effect.type === "Skill" ? "레벨" : ""}</b></div>)}</div><a className="injector-wiki" href={selected.wikiLink} target="_blank" rel="noreferrer">영문 위키에서 보기 <span>↗</span></a></aside>}
    </div><footer className="page-footer"><span>아이템 효과 데이터: Tarkov.dev</span><span>{injectors.length}종 등록</span></footer></section>;
}

type AmmoRecord = { id: string; name: string; icon: string; wikiLink: string; caliber: string; damage: number; armorDamage: number; penetrationPower: number; penetrationChance: number; initialSpeed: number; ballisticCoefficient: number; fragmentationChance: number; accuracyModifier?: number; recoilModifier?: number; heatFactor?: number; tracer: boolean };

function BallisticsPage() {
  const [ammo, setAmmo] = useState<AmmoRecord[]>([]);
  const [query, setQuery] = useState("");
  const [caliber, setCaliber] = useState("all");
  const [sort, setSort] = useState<"penetrationPower" | "damage" | "initialSpeed" | "caliber">("penetrationPower");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => { fetch("/ammo.json").then((response) => response.json()).then(setAmmo).catch(() => setAmmo([])); }, []);
  const calibers = [...new Set(ammo.map((item) => item.caliber))].sort();
  const caliberNames: Record<string, string> = { Caliber556x45NATO: "5.56×45mm NATO", Caliber762x51NATO: "7.62×51mm NATO", Caliber762x39: "7.62×39mm", Caliber545x39: "5.45×39mm", Caliber9x19PARA: "9×19mm", Caliber9x18PM: "9×18mm PM", Caliber762x25TT: "7.62×25mm TT", Caliber762x54R: "7.62×54mmR", Caliber9x39: "9×39mm", Caliber366TKM: ".366 TKM", Caliber12g: "12/70", Caliber20g: "20/70", Caliber23x75: "23×75mm", Caliber127x55: "12.7×55mm", Caliber762x35: ".300 Blackout", Caliber86x70: ".338 Lapua Magnum", Caliber46x30: "4.6×30mm", Caliber57x28: "5.7×28mm FN", Caliber9x21: "9×21mm Gyurza", Caliber127x108: "12.7×108mm" };
  const caliberLabel = (value: string) => caliberNames[value] ?? value.replace(/^Caliber/, "");
  const displayName = (value: string) => value.replace(/-(?:556x45|545x39|762x39|762x51|762x54r|9x19|9x18|9x39|366tkm|12x70|20x70|127x55|300blk|86x70|46x30|57x28|9x21)[^-]*/i, "").split("-").map((part) => part.toUpperCase() === "fmj" ? "FMJ" : part[0]?.toUpperCase() + part.slice(1)).join(" ");
  const filtered = ammo.filter((item) => (caliber === "all" || item.caliber === caliber) && `${item.name} ${displayName(item.name)}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "caliber" ? caliberLabel(a.caliber).localeCompare(caliberLabel(b.caliber)) || displayName(a.name).localeCompare(displayName(b.name)) : b[sort] - a[sort]);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  return <section className="page-content ballistics-page"><header className="page-heading"><div><span className="eyebrow">AMMUNITION / BALLISTICS</span><h1>탄도학</h1><p>탄약의 피해량, 관통력, 방탄 피해, 탄속을 비교합니다.</p></div><label className="ballistics-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="탄약 검색" /></label></header>
    <div className="ballistics-controls"><label>탄종<select value={caliber} onChange={(event) => setCaliber(event.target.value)}><option value="all">전체 탄종</option>{calibers.map((item) => <option key={item} value={item}>{caliberLabel(item)}</option>)}</select></label><label>정렬<select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="penetrationPower">관통력</option><option value="damage">피해량</option><option value="initialSpeed">탄속</option><option value="caliber">탄종별</option></select></label><span className="ballistics-count">{filtered.length}발</span></div>
    <div className="ballistics-layout"><div className="ballistics-table-wrap"><table className="ballistics-table"><thead><tr><th>탄약</th><th>피해량</th><th>방탄 피해</th><th>관통력</th><th>관통 확률</th><th>초속</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} onClick={() => setSelectedId(item.id)} className={selected?.id === item.id ? "selected" : ""}><td><span className="ammo-name"><img src={item.icon} alt="" /><span><strong>{displayName(item.name)}</strong><small>{caliberLabel(item.caliber)}{item.tracer ? " · 예광탄" : ""}</small></span></span></td><td>{item.damage}</td><td>{item.armorDamage}</td><td className="ammo-penetration">{item.penetrationPower}</td><td>{Math.round(item.penetrationChance * 100)}%</td><td>{item.initialSpeed} m/s</td></tr>)}</tbody></table>{filtered.length === 0 && <div className="injector-empty">검색 결과가 없습니다.</div>}</div>
      {selected && <aside className="ammo-detail"><div className="ammo-detail-head"><img src={selected.icon} alt="" /><div><span className="eyebrow">AMMUNITION DETAIL</span><h2>{displayName(selected.name)}</h2><small>{caliberLabel(selected.caliber)}</small></div></div><div className="ammo-stats"><div><span>피해량</span><b>{selected.damage}</b></div><div><span>방탄 피해</span><b>{selected.armorDamage}</b></div><div><span>관통력</span><b>{selected.penetrationPower}</b></div><div><span>관통 확률</span><b>{Math.round(selected.penetrationChance * 100)}%</b></div><div><span>탄속</span><b>{selected.initialSpeed} m/s</b></div><div><span>탄도 계수</span><b>{selected.ballisticCoefficient.toFixed(3)}</b></div><div><span>파편화 확률</span><b>{Math.round(selected.fragmentationChance * 100)}%</b></div><div><span>탄종</span><b>{selected.tracer ? "예광탄" : "일반탄"}</b></div>{selected.recoilModifier !== undefined && selected.recoilModifier !== 0 && <div><span>반동 변경</span><b>{selected.recoilModifier > 0 ? "+" : ""}{Math.round(selected.recoilModifier * 100)}%</b></div>}{selected.accuracyModifier !== undefined && selected.accuracyModifier !== 0 && <div><span>정확도 변경</span><b>{selected.accuracyModifier > 0 ? "+" : ""}{Math.round(selected.accuracyModifier * 100)}%</b></div>}{selected.heatFactor !== undefined && selected.heatFactor !== 1 && <div><span>발열 변경</span><b>{selected.heatFactor > 1 ? "+" : ""}{Math.round((selected.heatFactor - 1) * 100)}%</b></div>}</div><a className="injector-wiki" href={selected.wikiLink} target="_blank" rel="noreferrer">영문 위키에서 보기 <span>↗</span></a></aside>}
    </div><footer className="page-footer"><span>탄약 데이터: Tarkov.dev</span><span>{ammo.length}종 등록 · 정렬은 선택한 수치 기준</span></footer></section>;
}

type CatalogItem = { id: string; name: string; normalizedName: string; types: string[]; width: number; height: number; weight: number | null; basePrice: number | null; wikiLink: string; icon: string; properties: Record<string, string | number | string[]> };
const itemTypeLabels: Record<string, string> = { gun: "무기", ammo: "탄약", ammoBox: "탄약 상자", wearable: "방어구·의류", mods: "무기 부품", barter: "거래품", keys: "열쇠", provisions: "식량·음료", meds: "의료품", injectors: "주사기", grenade: "수류탄", pistolGrip: "권총 손잡이", rig: "전술 조끼", suppressor: "소음기", armor: "방탄 장비", armorPlate: "방탄판", helmet: "헬멧", backpack: "배낭", glasses: "안경", headphones: "헤드셋", container: "보관함", specialSlot: "특수 슬롯", poster: "장식품", preset: "프리셋" };
const itemPropertyLabels: Record<string, string> = { caliber: "탄종", damage: "피해량", armorDamage: "방탄 피해", penetrationPower: "관통력", ergonomics: "인체공학", recoilVertical: "수직 반동", recoilHorizontal: "수평 반동", fireRate: "연사력", armorClass: "방어 등급", maxDurability: "내구도", useTime: "사용 시간", cures: "치료 효과", stackMaxSize: "최대 중첩", ammoType: "탄 종류" };

function ItemsPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<"name" | "price">("name");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(120);
  useEffect(() => { fetch("/items.json").then((response) => response.json()).then(setItems).catch(() => setItems([])); }, []);
  useEffect(() => setLimit(120), [query, type, sort]);
  const types = useMemo(() => [...new Set(items.flatMap((item) => item.types))].sort(), [items]);
  const filtered = useMemo(() => items.filter((item) => (type === "all" || item.types.includes(type)) && `${item.name} ${item.normalizedName}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : (b.basePrice ?? 0) - (a.basePrice ?? 0)), [items, query, sort, type]);
  const selected = useMemo(() => filtered.find((item) => item.id === selectedId) ?? filtered[0], [filtered, selectedId]);
  const categoryName = (value: string) => itemTypeLabels[value] ?? value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  const openWiki = (event: React.MouseEvent<HTMLAnchorElement>, url: string) => { if (isTauri()) { event.preventDefault(); void openUrl(url).catch((reason) => console.error("Failed to open item wiki page", reason)); } };
  return <section className="page-content item-catalog-page"><header className="page-heading"><div><span className="eyebrow">FIELD GUIDE · ITEMS</span><h1>아이템 도감</h1><p>무기와 장비, 거래품을 검색하고 기본 정보를 확인합니다.</p></div><span className="item-catalog-total">{filtered.length.toLocaleString()}종</span></header>
    <div className="item-catalog-toolbar"><label className="item-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="아이템 이름 검색" /></label><label>종류<select value={type} onChange={(event) => setType(event.target.value)}><option value="all">전체 종류</option>{types.map((value) => <option key={value} value={value}>{categoryName(value)}</option>)}</select></label><label>정렬<select value={sort} onChange={(event) => setSort(event.target.value as "name" | "price")}><option value="name">이름순</option><option value="price">기준 가격순</option></select></label></div>
    {!items.length ? <div className="item-catalog-empty">아이템 데이터를 불러오는 중입니다.</div> : <div className="item-catalog-layout"><div className="item-catalog-results"><div className="item-catalog-grid">{filtered.slice(0, limit).map((item) => <button type="button" key={item.id} className={`item-catalog-card ${selected?.id === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}><img src={item.icon} alt="" loading="lazy" /><span><strong>{item.name}</strong><small>{item.types.slice(0, 2).map(categoryName).join(" · ") || "기타"}</small></span></button>)}</div>{filtered.length > limit && <button type="button" className="item-load-more" onClick={() => setLimit((current) => current + 120)}>더 보기 · {Math.min(120, filtered.length - limit)}개</button>}{!filtered.length && <p className="item-catalog-empty">검색 결과가 없습니다.</p>}</div>
      {selected && <aside className="item-catalog-detail"><div className="item-detail-image"><img src={selected.icon} alt="" /></div><span className="eyebrow">ITEM DETAILS</span><h2>{selected.name}</h2><div className="item-type-tags">{selected.types.map((value) => <span key={value}>{categoryName(value)}</span>)}</div><dl><div><dt>무게</dt><dd>{selected.weight == null ? "—" : `${selected.weight} kg`}</dd></div><div><dt>크기</dt><dd>{selected.width} × {selected.height}</dd></div><div><dt>기준 가격</dt><dd>{selected.basePrice == null ? "—" : `${selected.basePrice.toLocaleString()} ₽`}</dd></div>{Object.entries(selected.properties).map(([key, value]) => <div key={key}><dt>{itemPropertyLabels[key] ?? categoryName(key)}</dt><dd>{Array.isArray(value) ? value.join(", ") : typeof value === "number" ? value.toLocaleString() : value}</dd></div>)}</dl>{selected.wikiLink && <a className="item-wiki-link" href={selected.wikiLink} target="_blank" rel="noreferrer" onClick={(event) => openWiki(event, selected.wikiLink)}>영문 위키에서 보기 ↗</a>}</aside>}</div>}
    <footer className="page-footer"><span>아이템 데이터: Tarkov.dev 오프라인 카탈로그</span><span>{items.length.toLocaleString()}종 등록</span></footer></section>;
}

function ComingSoon({ tab }: { tab: Tab }) {
  return <div className="page-content coming-page"><div className="eyebrow"><span className="live-dot" /> FIELDNOTE MODULE</div><h1>{tab} <em>준비 중</em></h1><p>이 모듈은 다음 업데이트에서 사용할 수 있습니다.</p><div className="coming-card"><div className="coming-icon"><Backpack size={25} /></div><div><span className="eyebrow">MODULE STATUS</span><strong>{tab} 데이터베이스 동기화 대기 중</strong></div><span className="tag">COMING SOON</span></div></div>;
}

export default App;

