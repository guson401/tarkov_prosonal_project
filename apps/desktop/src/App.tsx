import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import { isTauri } from "@tauri-apps/api/core";
import {
  Activity, Backpack, Bell, BookOpen, ChevronDown, Clock3, Crosshair, Eye, EyeOff, Home,
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

type Tab = "홈" | "프로필" | "퀘스트" | "아이템" | "맵" | "파티" | "스킬";
type QuestRecord = { id: number; title: string; titleKo: string; objectivesKo: string[]; sectionsKo?: { title: string; titleKo: string; text: string; translationSource: string }[]; url: string; content: string; trader: string; map: string; prerequisites: string; unlocks: string; kappa: boolean };
type QuestPayload = { source: string; sourceUrl: string; terminologySource: string; terminologySourceUrl: string; license: string; licenseUrl: string; attribution: string; fetchedAt: string; contentTranslation?: string; contentTranslationUrl?: string; contentTranslatedAt?: string; quests: QuestRecord[] };
type PlayerProfile = { name: string; level: number; prestige: number; traderRep: Record<string, number>; skills: Record<string, number>; weaponMastery: Record<string, number>; prestigeMode: "PVP" | "PVE"; stashRoubles: number; hideout: Record<string, number>; prestigeChecks: Record<string, boolean> };
const skillCatalog: { id: string; name: string; category: string }[] = [
  ...["Endurance", "Health", "Immunity", "Metabolism", "Strength", "Stress Resistance", "Vitality"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Physical" })),
  ...["Aim Drills", "Assault Rifles", "Bolt-action Rifles", "DMRs", "Heavy Machine Guns", "Light Machine Guns", "Melee", "Pistols", "Revolvers", "Grenade Launchers", "Shotguns", "Submachine Guns", "Throwables", "Troubleshooting", "Underbarrel Launchers"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Combat" })),
  ...["Covert Movement", "Crafting", "Heavy Vests", "Hideout Management", "Light Vests", "Mag Drills", "Search", "Surgery", "Weapon Maintenance"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Practical" })),
  ...["Attention", "Charisma", "Intellect", "Perception"].map((name) => ({ id: name.toLowerCase(), name, category: "Mental" })),
  ...["Auctions", "Clean Operations", "Field Medicine", "First Aid", "Lockpicking", "Night Ops", "Shadow Connections", "Silent Ops", "Task Performance"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Other" })),
  ...["BEAR AK Systems", "BEAR Assault Operations", "BEAR Authority", "BEAR Heavy Caliber", "BEAR Raw Power"].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "_"), name, category: "Other" })),
];
const PROFILE_KEY = "fieldnote.profile";
const DEFAULT_PROFILE: PlayerProfile = { name: "SCAV-0412", level: 24, prestige: 0, traderRep: {}, skills: Object.fromEntries(skillCatalog.map((skill) => [skill.id, 0])), weaponMastery: {}, prestigeMode: "PVE", stashRoubles: 0, hideout: {}, prestigeChecks: {} };

const navItems: { label: Tab; icon: typeof Home }[] = [
  { label: "홈", icon: Home },
  { label: "프로필", icon: UserRound },
  { label: "퀘스트", icon: Crosshair },
  { label: "아이템", icon: Backpack },
  { label: "맵", icon: Map },
  { label: "스킬", icon: Activity },
  { label: "파티", icon: Users },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("홈");
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}") as Partial<PlayerProfile>;
      return { ...DEFAULT_PROFILE, ...saved, skills: { ...DEFAULT_PROFILE.skills, ...saved.skills }, weaponMastery: saved.weaponMastery ?? {}, traderRep: saved.traderRep ?? {}, hideout: saved.hideout ?? {}, prestigeChecks: saved.prestigeChecks ?? {} };
    }
    catch { return DEFAULT_PROFILE; }
  });
  const [completedQuests, setCompletedQuests] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("fieldnote.completedQuests") ?? "[]") as number[]); }
    catch { return new Set(); }
  });
  const [sqliteReady, setSqliteReady] = useState(false);
  const playerName = profile.name;
  const updateProfile = (next: PlayerProfile) => { setProfile(next); localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); };

  useEffect(() => {
    if (!isTauri()) { setSqliteReady(true); return; }
    let cancelled = false;
    void (async () => {
      const db = await Database.load("sqlite:tarkov_companion.db");
      if (cancelled) return;
      await db.execute("INSERT OR IGNORE INTO profiles (profile_id, profile_name, player_level, prestige_level, created_at, updated_at) VALUES (1, ?, ?, ?, datetime('now'), datetime('now'))", [profile.name, profile.level, profile.prestige]);
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
      await db.execute("UPDATE profiles SET profile_name = ?, player_level = ?, prestige_level = ?, updated_at = datetime('now') WHERE profile_id = 1", [profile.name, profile.level, profile.prestige]);
      for (const skill of skillCatalog) await db.execute("INSERT INTO profile_skills (profile_id, skill_id, level, updated_at) VALUES (1, ?, ?, datetime('now')) ON CONFLICT(profile_id, skill_id) DO UPDATE SET level = excluded.level, updated_at = excluded.updated_at", [skill.id, profile.skills[skill.id] ?? 0]);
      await db.execute("DELETE FROM profile_weapon_mastery WHERE profile_id = 1");
      for (const [weapon, level] of Object.entries(profile.weaponMastery)) await db.execute("INSERT INTO profile_weapon_mastery (profile_id, weapon_key, level, updated_at) VALUES (1, ?, ?, datetime('now'))", [weapon, level]);
    })().catch((error) => console.error("Failed to save profile skills to SQLite", error));
    return () => { cancelled = true; };
  }, [sqliteReady, profile.name, profile.level, profile.prestige, profile.skills, profile.weaponMastery]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Shield size={20} /></div><div><strong>FIELD<span>NOTE</span></strong><small>TARKOV COMPANION</small></div></div>
        <div className="sidebar-label">메인 메뉴</div>
        <nav aria-label="메인 메뉴">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeTab === label ? "active" : ""}`} onClick={() => setActiveTab(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="season-card"><span className="eyebrow">CURRENT WIPE</span><strong>타르코프의 겨울</strong><div className="season-progress"><i /></div><small>와이프 진행도 <b>42%</b></small></div><button className="nav-item muted"><Settings size={18} /><span>설정</span></button></div>
        <div className="sidebar-version">FIELDNOTE v0.1.0 <span>•</span> 로컬 모드</div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb">FIELDNOTE <span>/</span> {activeTab.toUpperCase()}</div><div className="top-actions"><button className="icon-button" aria-label="검색"><Search size={18} /></button><button className="icon-button notification" aria-label="알림"><Bell size={18} /><i /></button><div className="top-divider" /><button className="profile-chip" onClick={() => setActiveTab("프로필")}><div className="avatar small-avatar">{playerName.slice(0, 1)}</div><span>{playerName}</span><ChevronDown size={14} /></button></div></header>

        {activeTab === "홈" ? <HomePage playerName={playerName} onMapSelection={() => setActiveTab("맵")} onQuestSelection={() => setActiveTab("퀘스트")} /> : activeTab === "프로필" ? <ProfilePage profile={profile} updateProfile={updateProfile} completedQuests={completedQuests} setCompletedQuests={setCompletedQuests} resetProfile={() => { updateProfile({ ...DEFAULT_PROFILE, prestige: profile.prestige, prestigeMode: profile.prestigeMode }); setCompletedQuests(new Set()); localStorage.setItem("fieldnote.completedQuests", "[]"); }} /> : activeTab === "맵" ? <MapsPage /> : activeTab === "스킬" ? <SkillsPage profile={profile} updateProfile={updateProfile} /> : activeTab === "퀘스트" ? <QuestsPage completed={completedQuests} setCompleted={setCompletedQuests} profile={profile} updateProfile={updateProfile} /> : <ComingSoon tab={activeTab} />}
      </main>
    </div>
  );
}

function MapsPage() {
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "cached">("cached");
  const [error, setError] = useState("");
  const [hiddenMarkers, setHiddenMarkers] = useState<Set<string>>(() => new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<MarkerCategoryId>>(() => new Set());
  const [markerSearch, setMarkerSearch] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

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

  useEffect(() => {
    setHiddenMarkers(new Set(mapMarkers.map((marker) => marker.id)));
    setSelectedMarker(null);
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
                {visibleMarkers.map((marker) => {
                  const point = projectMapMarker(marker.position, selectedMap.bounds, selectedMap.coordinateRotation);
                  const category = mapMarkerCategories.find((item) => item.id === marker.category);
                  if (!point || !category) return null;
                  return (
                    <button
                      key={marker.id}
                      type="button"
                      className={`map-marker marker-${marker.category}${selectedMarker?.id === marker.id ? " selected" : ""}`}
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

function getQuestTraderReputationRewards(quest: QuestRecord) {
  const rewardText = getQuestSections(quest.content).find((section) => section.title.toLowerCase() === "rewards")?.text ?? "";
  return [...rewardText.matchAll(/^([A-Za-z][A-Za-z ]*?)\s+Rep\s+([+-]?[0-9]+(?:\.[0-9]+)?)\s*$/gim)]
    .map((match) => [match[1].trim(), Number(match[2])] as const);
}

function QuestsPage({ completed, setCompleted, profile, updateProfile }: { completed: Set<number>; setCompleted: (value: Set<number>) => void; profile: PlayerProfile; updateProfile: (value: PlayerProfile) => void }) {
  const [payload, setPayload] = useState<QuestPayload | null>(null);
  const [selected, setSelected] = useState<QuestRecord | null>(null);
  const [query, setQuery] = useState("");
  const [trader, setTrader] = useState("All traders");
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/quests/quests.en.json").then(async (response) => {
      if (!response.ok) throw new Error("저장된 퀘스트 데이터를 읽지 못했습니다.");
      return response.json() as Promise<QuestPayload>;
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

  const traders = [...new Set(payload?.quests.map(getQuestTrader) ?? [])].sort((a, b) => a.localeCompare(b));
  const filtered = (payload?.quests ?? []).filter((quest) => {
    const translatedText = quest.sectionsKo?.map((section) => section.text).join(" ") ?? "";
    const matchesSearch = `${quest.title} ${quest.titleKo} ${quest.content} ${translatedText}`.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    return matchesSearch && (trader === "All traders" || getQuestTrader(quest) === trader);
  });
  const toggleCompleted = (quest: QuestRecord) => {
    const next = new Set(completed);
    const repRewards = getQuestTraderReputationRewards(quest);
    const traderRep = { ...profile.traderRep };
    const direction = next.has(quest.id) ? -1 : 1;
    if (direction < 0) next.delete(quest.id); else next.add(quest.id);
    for (const [traderName, rep] of repRewards) traderRep[traderName] = Number(((traderRep[traderName] ?? 0) + direction * rep).toFixed(2));
    localStorage.setItem("fieldnote.completedQuests", JSON.stringify([...next]));
    setCompleted(next);
    if (repRewards.length) updateProfile({ ...profile, traderRep });
  };

  return <div className="page-content quest-page">
    <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> QUEST ARCHIVE</div><h1>퀘스트 <em>데이터베이스</em></h1><p>영문 위키 원문을 기준으로 합니다. 게임 내 한국어 문구와 일치하는 제목·목표에만 번역을 적용하며 나머지는 원문을 보존합니다.</p></div><span className="tag">{payload ? `${payload.quests.length} QUEST PAGES` : "SYNCING"}</span></div>
    <div className="quest-toolbar">
      <label className="quest-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="퀘스트 이름 또는 내용 검색" /></label>
      <select aria-label="상인 필터" value={trader} onChange={(event) => setTrader(event.target.value)}><option value="All traders">전체 상인</option>{traders.map((name) => <option key={name} value={name}>{toKoreanTrader(name)}</option>)}</select>
      <span>{filtered.length}개 표시 · {completed.size}개 완료</span>
    </div>
    {error ? <div className="quest-error">{error}</div> : !payload ? <div className="quest-loading">위키 퀘스트 데이터를 불러오는 중…</div> : <section className="quest-browser">
      <div className="quest-list" aria-label="퀘스트 목록">{filtered.map((quest) => <button type="button" key={quest.id} onClick={() => setSelected(quest)} className={`quest-list-item ${selected?.id === quest.id ? "selected" : ""} ${completed.has(quest.id) ? "completed" : ""}`}>
        <span className="quest-list-check">{completed.has(quest.id) ? "✓" : ""}</span><span className="quest-list-copy"><strong>{quest.titleKo || quest.title}</strong><small>{toKoreanTrader(getQuestTrader(quest))} · {quest.objectivesKo[0] ?? getQuestSections(quest.content).find((section) => section.title.toLowerCase() === "objectives")?.text.split("\n")[0] ?? "상세 정보 보기"}</small></span><span className="quest-chevron">›</span>
      </button>)}{filtered.length === 0 && <p className="quest-empty">검색 결과가 없습니다.</p>}</div>
      <article className="quest-detail">{selected ? <>
      <div className="quest-detail-top"><div><span className="eyebrow">{toKoreanTrader(getQuestTrader(selected)).toUpperCase()} · WIKI QUEST</span><h2>{showOriginal ? selected.title : selected.titleKo || selected.title}</h2><div className="quest-tags">{selected.map && <span>{toKoreanMap(selected.map)}</span>}{selected.kappa && <span>카파 필수</span>}{selected.prerequisites && <span>선행: {payload?.quests.find((quest) => quest.title === selected.prerequisites)?.titleKo || selected.prerequisites}</span>}{selected.unlocks && <span>해금: {payload?.quests.find((quest) => quest.title === selected.unlocks)?.titleKo || selected.unlocks}</span>}</div></div><div className="quest-detail-actions"><button type="button" className="quest-view-toggle" aria-pressed={showOriginal} onClick={() => setShowOriginal((value) => !value)}>{showOriginal ? "번역 보기" : "영문 원문 보기"}</button><button type="button" className={`quest-complete ${completed.has(selected.id) ? "is-complete" : ""}`} onClick={() => toggleCompleted(selected)}>{completed.has(selected.id) ? "완료됨 ✓" : "완료 표시"}</button></div></div>
        {showOriginal ? <pre className="quest-original">{selected.content}</pre> : <div className="quest-sections">{getQuestSections(selected.content).map((section) => {
          const translatedSection = selected.sectionsKo?.find((item) => item.title === section.title);
          const heading = translatedSection?.titleKo ?? ({ Dialogue: "대화", Requirements: "요구 조건", Objectives: "목표", Rewards: "보상", Guide: "공략", "Failure Penalty": "실패 시 불이익", "Failure Dialogue": "실패 대사", "See also": "관련 문서" } as Record<string, string>)[section.title] ?? section.title;
          const text = translatedSection?.text || section.text;
          const sourceLabel = translatedSection?.translationSource === "Tarkov.dev game localization" ? "게임 한국어" : translatedSection ? "영문 기반 번역" : "영문 원문";
          return <section key={section.title}><h3>{heading}<small className={translatedSection ? "quest-translation-mark" : "quest-source-mark"}>{sourceLabel}</small></h3><div>{text.split("\n").map((line, index) => line.trim() ? <p key={`${section.title}-${index}`}>{line.trim()}</p> : null)}</div></section>;
        })}</div>}
        <a className="quest-source" href={selected.url} target="_blank" rel="noreferrer">영문 위키에서 원문 열기 ↗</a>
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

const traderThresholds: Record<string, { level: number; rep: number }[]> = {
  Prapor: [{ level: 6, rep: 0.7 }, { level: 21, rep: 2.7 }, { level: 36, rep: 7.9 }],
  Therapist: [{ level: 5, rep: 0.6 }, { level: 18, rep: 2.1 }, { level: 37, rep: 5.8 }],
  Skier: [{ level: 7, rep: 0.6 }, { level: 22, rep: 2.1 }, { level: 38, rep: 5.8 }],
  Peacekeeper: [{ level: 8, rep: 0.5 }, { level: 19, rep: 2.2 }, { level: 37, rep: 6.0 }],
  Mechanic: [{ level: 12, rep: 0.6 }, { level: 26, rep: 2.3 }, { level: 40, rep: 7.6 }],
  Ragman: [{ level: 12, rep: 0.5 }, { level: 27, rep: 2.0 }, { level: 42, rep: 6.5 }],
  Jaeger: [{ level: 9, rep: 0.6 }, { level: 17, rep: 2.1 }, { level: 33, rep: 7.3 }],
  Ref: [{ level: 15, rep: 0.25 }, { level: 25, rep: 0.5 }, { level: 35, rep: 1.2 }],
  Fence: [{ level: 1, rep: 6.0 }],
};
function traderLevel(trader: string, rep: number, playerLevel: number) {
  if (trader === "Fence") return rep >= 6 ? 4 : 1;
  return 1 + (traderThresholds[trader] ?? []).filter((threshold) => playerLevel >= threshold.level && rep >= threshold.rep).length;
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
  const updateSkill = (id: string, level: number) => updateProfile({ ...profile, skills: { ...profile.skills, [id]: Math.min(51, Math.max(0, level)) } });
  const updateMastery = (id: string, level: number) => updateProfile({ ...profile, weaponMastery: { ...profile.weaponMastery, [id]: Math.min(3, Math.max(0, level)) } });
  const groups = ["Physical", "Combat", "Practical", "Mental", "Other"];
  return <div className="page-content skills-page"><div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> OPERATIVE SKILLS</div><h1>캐릭터 <em>스킬</em></h1><p>스킬 레벨은 0~51로 기록하며, 51은 화면에서 마스터로 표시합니다. 데이터는 SQLite와 이 기기에 저장됩니다.</p></div><span className="tag">{skillCatalog.length} SKILLS</span></div>
    {groups.map((group) => <section className={`panel skill-group ${group === "Other" ? "supplemental-skills" : ""}`} key={group}><div className="panel-heading"><div><span className="eyebrow">{group.toUpperCase()}</span><h3>{group === "Physical" ? "신체" : group === "Mental" ? "정신" : group === "Combat" ? "전투" : group === "Practical" ? "실용" : "추가 API 데이터"} 스킬</h3>{group === "Other" && <p className="field-hint">현재 인게임 스킬 목록에는 없는 Tarkov.dev 기술 데이터입니다.</p>}</div></div><div className="skill-grid">{skillCatalog.filter((skill) => skill.category === group).map((skill) => { const level = profile.skills[skill.id] ?? 0; return <label className="skill-card" key={skill.id}><span>{skill.name}</span><b>{level === 51 ? "마스터" : level}</b><input aria-label={`${skill.name} 스킬 레벨`} type="number" min={0} max={51} value={level} onChange={(event) => updateSkill(skill.id, Number(event.target.value) || 0)} /></label>; })}</div></section>)}
    <section className="panel skill-group"><div className="panel-heading"><div><span className="eyebrow">WEAPON MASTERY</span><h3>무기 숙련도</h3></div></div><p className="field-hint">무기별 숙련도는 0~3으로 기록합니다. 목록 이름은 인게임 표기를 입력하세요.</p><div className="mastery-add"><input value={masteryName} placeholder="예: AK-74" onChange={(event) => setMasteryName(event.target.value)} /><button type="button" onClick={() => { const name = masteryName.trim(); if (name && !(name in profile.weaponMastery)) updateMastery(name, 0); setMasteryName(""); }}>무기 추가</button></div><div className="mastery-list">{Object.entries(profile.weaponMastery).sort(([a], [b]) => a.localeCompare(b)).map(([weapon, level]) => <label key={weapon}><span>{weapon}</span><input aria-label={`${weapon} 숙련도`} type="number" min={0} max={3} value={level} onChange={(event) => updateMastery(weapon, Number(event.target.value) || 0)} /><button type="button" aria-label={`${weapon} 제거`} onClick={() => { const next = { ...profile.weaponMastery }; delete next[weapon]; updateProfile({ ...profile, weaponMastery: next }); }}>×</button></label>)}</div></section>
  </div>;
}

function ProfilePage({ profile, updateProfile, completedQuests, setCompletedQuests, resetProfile }: { profile: PlayerProfile; updateProfile: (value: PlayerProfile) => void; completedQuests: Set<number>; setCompletedQuests: (value: Set<number>) => void; resetProfile: () => void }) {
  const setPlayerName = (name: string) => updateProfile({ ...profile, name });
  const updateRep = (trader: string, value: number) => updateProfile({ ...profile, traderRep: { ...profile.traderRep, [trader]: value } });
  return <div className="page-content profile-page"><div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> OPERATIVE DOSSIER</div><h1>오퍼레이터 <em>프로필</em></h1><p>PMC 레벨, 프레스티지, 상인 평판과 퀘스트 진행 상황을 관리합니다.</p></div><button className="reset-profile" onClick={() => { if (window.confirm("프로필과 퀘스트 완료 및 상인 평판을 모두 초기화할까요?")) resetProfile(); }}>프로필 초기화</button></div>
    <section className="profile-banner"><div className="profile-emblem"><Shield size={52} strokeWidth={1.2} /><span>U</span></div><div className="profile-identity"><span className="eyebrow">UNITED SECURITY</span><h2>{profile.name}</h2><p>민간 군사 기업 오퍼레이터 <span>·</span> 등록일 2026.06.14</p></div><span className="level-badge">LVL <b>{profile.level}</b></span><span className="level-badge">PRESTIGE <b>{profile.prestige}</b></span></section>
    <div className="profile-columns"><section className="panel profile-details"><div className="panel-heading"><div><span className="eyebrow">PERSONAL DATA</span><h3>기본 정보</h3></div><UserRound size={18} className="panel-icon" /></div><label className="form-label">오퍼레이터 호출명</label><div className="input-wrap"><input value={profile.name} maxLength={20} onChange={(event) => setPlayerName(event.target.value)} /><span>{profile.name.length}/20</span></div><p className="field-hint">변경 사항은 자동 저장됩니다.</p><div className="profile-input-row"><label>PMC 레벨<input type="number" min={1} max={79} value={profile.level} onChange={(event) => updateProfile({ ...profile, level: Math.min(79, Math.max(1, Number(event.target.value) || 1)) })} /></label><label>프레스티지 단계<output>{profile.prestige} / 6</output></label></div><div className="detail-divider" /><div className="detail-line"><span>진영</span><b><i className="faction-dot" /> USEC</b></div><div className="detail-line"><span>완료 퀘스트</span><b>{completedQuests.size}개</b></div><p className="field-hint">상인 등급 계산에서는 거래액 조건을 제외하고 PMC 레벨과 평판만 적용합니다.</p></section>
      <section className="panel profile-traders"><div className="panel-heading"><div><span className="eyebrow">LOYALTY LEVELS</span><h3>상인 평판 및 등급</h3></div><Users size={18} className="panel-icon" /></div><div className="trader-table">{traderOrder.map((trader) => { const rep = profile.traderRep[trader] ?? 0; const levels = traderThresholds[trader] ?? []; const current = traderLevel(trader, rep, profile.level); const next = levels[current - 1]; const condition = trader === "Fence" ? "스캐브 카르마 6.00 필요" : trader === "Lightkeeper" ? "퀘스트 진행으로 해금" : trader === "BTR Driver" ? "특수 상인" : next ? `다음: PMC 레벨 ${next.level} · 평판 ${next.rep.toFixed(2)}` : "최고 등급"; return <div className="trader-row" key={trader}><div className="trader-name"><strong>{toKoreanTrader(trader)} <span>LL{current}</span></strong><small>{condition}{trader === "Fence" ? " · 평판은 스캐브 카르마와 연동" : " · 거래액 조건 제외"}</small></div><label>평판<input aria-label={`${toKoreanTrader(trader)} 평판`} type="number" step="0.01" value={rep} onChange={(event) => updateRep(trader, Number(event.target.value) || 0)} /></label></div>; })}</div><p className="field-hint">상인별 기준은 2026년 1.1.5 패치 공개 기준이며, Fence는 별도의 카르마 기준을 씁니다.</p></section></div>
    <PrestigePanel profile={profile} updateProfile={updateProfile} setCompletedQuests={setCompletedQuests} />
    <footer className="page-footer"><span>FIELDNOTE INTELLIGENCE SYSTEM</span><span>프로필과 상인 평판은 이 기기에 저장됩니다.</span></footer></div>;
}

function PrestigePanel({ profile, updateProfile, setCompletedQuests }: { profile: PlayerProfile; updateProfile: (value: PlayerProfile) => void; setCompletedQuests: (value: Set<number>) => void }) {
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
    updateProfile({ ...profile, level: 1, prestige: stage, traderRep: {}, skills, weaponMastery, stashRoubles: 0, hideout: {}, prestigeChecks: {} });
    setCompletedQuests(new Set());
    localStorage.setItem("fieldnote.completedQuests", "[]");
  };
  return <section className="panel prestige-panel"><div className="panel-heading"><div><span className="eyebrow">PRESTIGE PROGRESSION</span><h3>프레스티지 {stage <= 6 ? `${stage} 승급 조건` : "최고 단계"}</h3></div><span className="tag">현재 {profile.prestige} 단계</span></div>
    <div className="prestige-config"><label>게임 모드<select value={profile.prestigeMode} onChange={(event) => updateProfile({ ...profile, prestigeMode: event.target.value as "PVP" | "PVE" })}><option value="PVE">PvE</option><option value="PVP">PvP</option></select></label><span>루블 조건은 승급 요건에서 제외 · 승급 후 스킬·무기 숙련도 유지: {retained}% · 카리스마 +1</span></div>
    <div className="prestige-checklist">{checks.map((check) => <div className={`prestige-check ${check.complete ? "complete" : ""}`} key={check.key}><span>{check.complete ? "✓" : "○"}</span><strong>{check.label}</strong>{check.hideoutId && <input type="number" min={0} max={3} aria-label={check.label} value={profile.hideout[check.hideoutId] ?? 0} onChange={(event) => updateProfile({ ...profile, hideout: { ...profile.hideout, [check.hideoutId!]: Number(event.target.value) || 0 } })} />}{check.manualKey && <input type="checkbox" checked={check.complete} onChange={(event) => setCheck(check.manualKey!, event.target.checked)} />}</div>)}</div>
    {stage <= 6 ? <button className="prestige-button" disabled={!ready} onClick={prestige}>{ready ? `프레스티지 ${stage} 실행` : `조건 ${checks.filter((check) => check.complete).length} / ${checks.length} 충족`}</button> : <p className="field-hint">모든 프레스티지 단계를 완료했습니다.</p>}
    <p className="field-hint">승급하면 PMC 레벨·퀘스트·상인 평판·은신처·루블을 초기화하고, 해당 단계의 유지 비율만큼 스킬과 웨폰 마스터링을 남깁니다.</p>
  </section>;
}
function ComingSoon({ tab }: { tab: Tab }) {
  return <div className="page-content coming-page"><div className="eyebrow"><span className="live-dot" /> FIELDNOTE MODULE</div><h1>{tab} <em>준비 중</em></h1><p>이 모듈은 다음 업데이트에서 사용할 수 있습니다.</p><div className="coming-card"><div className="coming-icon"><Backpack size={25} /></div><div><span className="eyebrow">MODULE STATUS</span><strong>{tab} 데이터베이스 동기화 대기 중</strong></div><span className="tag">COMING SOON</span></div></div>;
}

export default App;
