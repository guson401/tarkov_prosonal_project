import { useEffect, useState } from "react";
import {
  Activity, Backpack, Bell, BookOpen, ChevronDown, Clock3, Crosshair, Eye, EyeOff, Home,
  Map, MapPin, Search, Settings, Shield, UserRound, Users, Wallet,
} from "lucide-react";
import {
  getMapMarkerCategories, getMapMarkers, projectMapMarker, toMapOptions,
  type MapCatalogEntry, type MapMarker, type MarkerCategoryId, type MapOption, type TarkovMap,
} from "./map-data";
import "./maps.css";

type Tab = "홈" | "프로필" | "퀘스트" | "아이템" | "맵" | "파티";

const navItems: { label: Tab; icon: typeof Home }[] = [
  { label: "홈", icon: Home },
  { label: "프로필", icon: UserRound },
  { label: "퀘스트", icon: Crosshair },
  { label: "아이템", icon: Backpack },
  { label: "맵", icon: Map },
  { label: "파티", icon: Users },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("홈");
  const [playerName, setPlayerName] = useState("SCAV-0412");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Shield size={20} /></div><div><strong>FIELD<span>NOTE</span></strong><small>TARKOV COMPANION</small></div></div>
        <div className="sidebar-label">메인 메뉴</div>
        <nav aria-label="메인 메뉴">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeTab === label ? "active" : ""}`} onClick={() => setActiveTab(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "퀘스트" && <i className="nav-count">3</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="season-card"><span className="eyebrow">CURRENT WIPE</span><strong>타르코프의 겨울</strong><div className="season-progress"><i /></div><small>와이프 진행도 <b>42%</b></small></div><button className="nav-item muted"><Settings size={18} /><span>설정</span></button></div>
        <div className="sidebar-version">FIELDNOTE v0.1.0 <span>•</span> 로컬 모드</div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb">FIELDNOTE <span>/</span> {activeTab.toUpperCase()}</div><div className="top-actions"><button className="icon-button" aria-label="검색"><Search size={18} /></button><button className="icon-button notification" aria-label="알림"><Bell size={18} /><i /></button><div className="top-divider" /><button className="profile-chip" onClick={() => setActiveTab("프로필")}><div className="avatar small-avatar">{playerName.slice(0, 1)}</div><span>{playerName}</span><ChevronDown size={14} /></button></div></header>

        {activeTab === "홈" ? <HomePage playerName={playerName} onMapSelection={() => setActiveTab("맵")} /> : activeTab === "프로필" ? <ProfilePage playerName={playerName} setPlayerName={setPlayerName} /> : activeTab === "맵" ? <MapsPage /> : <ComingSoon tab={activeTab} />}
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

function HomePage({ playerName, onMapSelection }: { playerName: string; onMapSelection: () => void }) {
  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> OPERATIVE DASHBOARD</div><h1>좋은 아침입니다, <em>{playerName}</em></h1><p>오늘의 타르코프 작전을 준비하세요.</p></div><button className="date-pill">2026년 11월 24일 <span>화요일</span></button></div>
    <section className="hero-card"><div className="hero-noise" /><div className="hero-copy"><div className="hero-kicker"><span className="tag">DEPLOYMENT STATUS</span><span className="status-dot" /> 작전 준비 완료</div><h2>다음 레이드를<br /><em>계획해 보세요.</em></h2><p>장비를 확인하고, 목표를 설정하고, 안전하게 귀환하세요.</p><button className="primary-button" onClick={onMapSelection}>맵 선택 <span>↗</span></button></div><div className="hero-graphic"><div className="scope-ring ring-one" /><div className="scope-ring ring-two" /><div className="scope-cross horizontal" /><div className="scope-cross vertical" /><div className="scope-center"><Crosshair size={44} strokeWidth={1} /></div><span className="coord coord-a">37° 42′ N</span><span className="coord coord-b">59° 11′ E</span><span className="map-label">TERRAGROUP<br />RESTRICTED AREA</span></div><div className="hero-index">ZONE <b>01</b></div></section>
    <div className="section-title"><div><span className="section-index">01</span><h2>작전 현황</h2></div><span>OPERATIONS OVERVIEW</span></div>
    <section className="stats-grid"><StatCard icon={Activity} label="생존율" value="64" suffix="%" note="지난 30회 레이드" trend="+4.2%" /><StatCard icon={Crosshair} label="K/D 비율" value="3.8" suffix="" note="PMC 기준" trend="+0.3" /><StatCard icon={Wallet} label="보유 루블" value="2.45" suffix="M" note="₽ 루블" trend="잔액" /><StatCard icon={Shield} label="PMC 레벨" value="24" suffix="" note="다음 레벨까지 12,400 XP" trend="LV.24" /></section>
    <div className="lower-grid"><section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">FIELD REPORT</span><h3>최근 레이드</h3></div><button className="text-button">전체 기록 <span>→</span></button></div><div className="raid-row"><div className="raid-map customs"><span>C</span></div><div className="raid-info"><strong>커스텀</strong><span>오늘 14:32 · PMC · 28분</span></div><span className="raid-result survived"><i /> 생존</span><span className="raid-loot">₽ 184,200</span></div><div className="raid-row"><div className="raid-map woods"><span>W</span></div><div className="raid-info"><strong>우드</strong><span>어제 21:08 · PMC · 16분</span></div><span className="raid-result killed"><i /> 사망</span><span className="raid-loot dim">₽ 42,800</span></div><div className="raid-row"><div className="raid-map factory"><span>F</span></div><div className="raid-info"><strong>팩토리</strong><span>어제 19:45 · PMC · 11분</span></div><span className="raid-result survived"><i /> 생존</span><span className="raid-loot">₽ 96,500</span></div></section>
      <section className="panel tasks-panel"><div className="panel-heading"><div><span className="eyebrow">ACTIVE OBJECTIVES</span><h3>진행 중인 퀘스트</h3></div><BookOpen size={18} className="panel-icon" /></div><div className="task-item"><span className="task-check" /><div><strong>건스미스 - 파트 3</strong><small>필요한 무기 개조품을 찾아보세요.</small><div className="task-progress"><i style={{ width: "62%" }} /></div></div><b>2/3</b></div><div className="task-item"><span className="task-check done">✓</span><div><strong>쇼어라인 정찰</strong><small>리조트 서관에서 정보를 수집하세요.</small><div className="task-progress"><i style={{ width: "34%" }} /></div></div><b>1/3</b></div><button className="task-footer">퀘스트 목록 보기 <span>→</span></button></section></div>
    <footer className="page-footer"><span>FIELDNOTE INTELLIGENCE SYSTEM</span><span>모든 작전 데이터는 이 기기에 저장됩니다.</span></footer>
  </div>;
}

function StatCard({ icon: Icon, label, value, suffix, note, trend }: { icon: typeof Activity; label: string; value: string; suffix: string; note: string; trend: string }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><Icon size={17} /></div><div className="stat-value">{value}<small>{suffix}</small></div><div className="stat-bottom"><span>{note}</span><b>{trend}</b></div></article>;
}

function ProfilePage({ playerName, setPlayerName }: { playerName: string; setPlayerName: (name: string) => void }) {
  return <div className="page-content profile-page"><div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> OPERATIVE DOSSIER</div><h1>오퍼레이터 <em>프로필</em></h1><p>작전 기록과 오퍼레이터 정보를 관리합니다.</p></div><span className="tag profile-tag">PMC · USEC</span></div>
    <section className="profile-banner"><div className="profile-emblem"><Shield size={52} strokeWidth={1.2} /><span>U</span></div><div className="profile-identity"><span className="eyebrow">UNITED SECURITY</span><h2>{playerName}</h2><p>민간 군사 기업 오퍼레이터 <span>·</span> 등록일 2026.06.14</p></div><span className="level-badge">LVL <b>24</b></span></section>
    <div className="profile-columns"><section className="panel profile-details"><div className="panel-heading"><div><span className="eyebrow">PERSONAL DATA</span><h3>기본 정보</h3></div><UserRound size={18} className="panel-icon" /></div><label className="form-label">오퍼레이터 호출명</label><div className="input-wrap"><input value={playerName} maxLength={20} onChange={(event) => setPlayerName(event.target.value)} /><span>{playerName.length}/20</span></div><p className="field-hint">레이드 기록과 대시보드에 표시되는 이름입니다.</p><div className="detail-divider" /><div className="detail-line"><span>진영</span><b><i className="faction-dot" /> USEC</b></div><div className="detail-line"><span>현재 와이프</span><b>타르코프의 겨울</b></div><div className="detail-line"><span>등록일</span><b>2026년 6월 14일</b></div><button className="save-button">프로필 저장 <span>→</span></button></section>
      <section className="panel profile-stats"><div className="panel-heading"><div><span className="eyebrow">COMBAT RECORD</span><h3>전투 기록</h3></div><Activity size={18} className="panel-icon" /></div><div className="record-big"><div><span className="eyebrow">SURVIVAL RATE</span><strong>64<small>%</small></strong></div><div className="survival-ring"><span>64<small>%</small></span></div></div><div className="profile-stat-list"><div><span>총 레이드</span><b>128회</b></div><div><span>생존 / 사망</span><b>82 <i>/</i> 46</b></div><div><span>K/D 비율</span><b>3.8</b></div><div><span>PMC 처치</span><b>214</b></div><div><span>평균 생존 시간</span><b>24분 18초</b></div></div></section></div>
    <footer className="page-footer"><span>FIELDNOTE INTELLIGENCE SYSTEM</span><span>프로필 변경 사항은 로컬에 저장됩니다.</span></footer></div>;
}

function ComingSoon({ tab }: { tab: Tab }) {
  return <div className="page-content coming-page"><div className="eyebrow"><span className="live-dot" /> FIELDNOTE MODULE</div><h1>{tab} <em>준비 중</em></h1><p>이 모듈은 다음 업데이트에서 사용할 수 있습니다.</p><div className="coming-card"><div className="coming-icon"><Backpack size={25} /></div><div><span className="eyebrow">MODULE STATUS</span><strong>{tab} 데이터베이스 동기화 대기 중</strong></div><span className="tag">COMING SOON</span></div></div>;
}

export default App;
