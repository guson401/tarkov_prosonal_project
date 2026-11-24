export type MapPosition = { x: number; y?: number; z: number };
export type MarkerCategoryId =
  | "extracts"
  | "spawns"
  | "pmcExtracts"
  | "scavExtracts"
  | "coopExtracts"
  | "pmcSpawns"
  | "scavSpawns"
  | "sniperScavs"
  | "bosses"
  | "lootContainers"
  | "lootLoose"
  | "hazards"
  | "switches"
  | "transits"
  | "stationaryWeapons"
  | "btrStops"
  | `lootContainer:${string}`;

export type MapMarker = {
  id: string;
  groupId?: string;
  category: MarkerCategoryId;
  label: string;
  position: MapPosition;
};

type PositionedMarker = {
  id?: string;
  name?: string;
  position?: MapPosition;
  faction?: string;
  sides?: string[];
  categories?: string[];
  zoneName?: string;
  hazardType?: string;
  lootContainer?: string | { id: string; name?: string; normalizedName?: string };
  stationaryWeapon?: string;
  description?: string;
};

export type TarkovMap = {
  id: string;
  normalizedName: string;
  name?: string;
  raidDuration?: number;
  players?: string;
  extracts?: PositionedMarker[];
  spawns?: PositionedMarker[];
  bosses?: {
    mob?: string;
    spawnLocations?: { name?: string; positions?: MapPosition[] }[];
  }[];
  lootContainers?: PositionedMarker[];
  lootLoose?: { position?: MapPosition }[];
  hazards?: PositionedMarker[];
  switches?: PositionedMarker[];
  transits?: PositionedMarker[];
  stationaryWeapons?: PositionedMarker[];
  btrStops?: (PositionedMarker & MapPosition)[];
};

export type MapCatalogEntry = {
  normalizedName: string;
  maps?: {
    projection?: string;
    svgPath?: string;
    bounds?: [[number, number], [number, number]];
    coordinateRotation?: number;
    viewBox?: [number, number];
  }[];
};

export type MapOption = TarkovMap & {
  displayName: string;
  imagePath: string;
  bounds: [[number, number], [number, number]];
  coordinateRotation: number;
  aspectRatio: number;
};

export const markerCategories: {
  id: MarkerCategoryId;
  label: string;
  symbol: string;
  defaultVisible?: boolean;
}[] = [
  { id: "pmcExtracts", label: "PMC 탈출 지점", symbol: "E" },
  { id: "scavExtracts", label: "SCAV 탈출 지점", symbol: "E" },
  { id: "coopExtracts", label: "협동 탈출구", symbol: "C" },
  { id: "pmcSpawns", label: "PMC 스폰", symbol: "P" },
  { id: "scavSpawns", label: "SCAV 스폰", symbol: "S" },
  { id: "sniperScavs", label: "저격 SCAV", symbol: "⌖" },
  { id: "extracts", label: "탈출 지점", symbol: "E", defaultVisible: true },
  { id: "spawns", label: "PMC / SCAV 스폰", symbol: "S" },
  { id: "bosses", label: "보스 출현 지점", symbol: "B", defaultVisible: true },
  { id: "lootContainers", label: "전리품 상자", symbol: "C" },
  { id: "lootLoose", label: "바닥 아이템", symbol: "L" },
  { id: "hazards", label: "위험 지역", symbol: "!" },
  { id: "switches", label: "스위치", symbol: "⚡" },
  { id: "transits", label: "전환 지점", symbol: "T" },
  { id: "stationaryWeapons", label: "고정 무기", symbol: "W" },
  { id: "btrStops", label: "BTR 정차 지점", symbol: "BTR" },
];

const lootContainerNames: Record<string, string> = {
  "578f8778245977358849a9b5": "재킷",
  "578f8782245977354405a1e3": "금고",
  "578f879c24597735401e6bc6": "금전 등록기",
  "578f87a3245977356274f2cb": "더플백",
  "578f87ad245977356274f2cc": "나무 상자",
  "578f87b7245977356274f2cd": "서랍",
  "5909d24f86f77466f56e6855": "SMU06 의료 가방",
  "5909d36d86f774660f0bb900": "수류탄 상자",
  "5909d45286f77465a8136dc6": "나무 탄약 상자",
  "5909d4c186f7746ad34e805a": "의료 케이스",
  "5909d50c86f774659e6aaebe": "공구함",
  "5909d5ef86f77467974efbd8": "무기 상자 (5×2)",
  "5909d76c86f77471e53d2adf": "무기 상자 (6×3)",
  "5909d7cf86f77470ee57d75a": "무기 상자 (4×4)",
  "5909d89086f77472591234a0": "무기 상자 (5×5)",
  "5909e4b686f7747f5b744fa4": "죽은 SCAV",
  "59139c2186f77411564f8e42": "PC 본체",
  "5914944186f774189e5e76c2": "재킷 (204호 열쇠)",
  "5937ef2b86f77408a47244b3": "재킷 (기계실 열쇠)",
  "59387ac686f77401442ddd61": "재킷 (114호 열쇠)",
  "5c052cea86f7746b2101e8d8": "플라스틱 여행 가방",
  "5d07b91b86f7745a077a9432": "슈트르만의 은닉처",
  "5d6d2b5486f774785c2ba8ea": "땅속 은닉처",
  "5d6d2bb386f774785b07a77a": "묻힌 드럼통 은닉처",
  "5d6fd13186f77424ad2a8c69": "식량 보급 상자",
  "5d6fd45b86f774317075ed43": "기술 보급 상자",
  "5d6fe50986f77449d97f7463": "의료 보급 상자",
  "5ad74cf586f774391278f6f0": "TAR2-2 금전 등록기",
  "61aa1e9a32a4743c3453d2cf": "강화 더플백",
  "61aa1ead84ea0800645777fd": "강화 SMU06 의료 가방",
  "61a89e5445a2672acf66c877": "공중 투하 보급 상자",
  "61a89e812cc17d60cc5f9879": "공중 투하 의료 상자",
  "61aa1e6984ea0800645777f9": "특수 무기 상자",
  "6223349b3136504a544d1608": "공중 투하 공용 상자",
  "622334c873090231d904a9fc": "공중 투하 의료 상자",
  "622334fa3136504a544d160c": "공중 투하 보급 상자",
  "6223351bb5d97a7b2c635ca7": "공중 투하 무기 상자",
  "64d116f41a9c6143a956127d": "은행 금전 등록기",
  "64d11702dd0cd96ab82c3280": "은행 금고 (4×4)",
  "6582e6bb0c3b9823fe6d1840": "죽은 SCAV (특수)",
  "6582e6c6edf14c4c6023adf2": "실험실 기술자 시체",
  "6582e6d7b14c3f72eb071420": "PMC 시체",
  "658420d8085fea07e674cdb6": "민간인 시체",
  "66acff0a1d8e1083b303f5af": "은행 금고 (3×3)",
  "67614e3a6a90e4f10b0b140d": "공용 보관함",
  "67adf4a95247ac91530fcec7": "미궁 전리품 상자 A",
  "67adf4b81c58bd68b2002fec": "미궁 전리품 상자 B",
  "67adf4db515e3dd542077a1d": "미궁 전리품 상자 C",
  "67adf4eb110ba15da90c6413": "미궁 전리품 상자 D",
  "67adf54d1c58bd68b2002ff0": "미궁 전리품 상자 E",
  "67adf5752fc5ee84020a9940": "미궁 전리품 상자 F",
  "67adf5f7adc1f43b0702b826": "미궁 전리품 상자 G",
  "691226272a5ee538f10d2f11": "터미널 금고",
  "69122762e5b8725fb10f6b32": "터미널 시체",
};

function lootContainerLabel(id: string, name?: string, normalizedName?: string) {
  if (name && /[가-힣]/.test(name)) return name;
  if (lootContainerNames[id]) return lootContainerNames[id];
  if (name) return translateMarkerName(name, "기타 전리품 상자");
  if (normalizedName) return translateMarkerName(normalizedName.replace(/-/g, " "), "기타 전리품 상자");
  return `기타 전리품 상자 (${id.slice(0, 6)})`;
}

export function getMapMarkerCategories(markers: MapMarker[]) {
  const present = new Set(markers.map((marker) => marker.category));
  const categories = markerCategories.filter((category) => present.has(category.id));
  for (const id of present) {
    if (!id.startsWith("lootContainer:")) continue;
    const containerId = id.slice("lootContainer:".length);
    categories.push({ id, label: lootContainerLabel(containerId), symbol: "C" });
  }
  return categories;
}

const koreanMapNameOverrides: Record<string, string> = {
  "streets-of-tarkov": "타르코프 시내",
  "ground-zero": "그라운드 제로",
  "ground-zero-21": "그라운드 제로",
  "ground-zero-tutorial": "그라운드 제로 튜토리얼",
  customs: "세관",
  factory: "공장",
  "night-factory": "야간 공장",
  interchange: "인터체인지",
  lighthouse: "등대",
  reserve: "리저브",
  shoreline: "해안선",
  woods: "삼림",
  terminal: "터미널",
  "the-lab": "연구소",
  "the-lab-dark": "연구소 (어두움)",
  "infected-lab": "감염된 연구소",
  "the-labyrinth": "미궁",
  icebreaker: "쇄빙선",
};

const koreanMapNames: Record<string, string> = {
  "streets-of-tarkov": "타르코프 시내",
  "ground-zero": "그라운드 제로",
  customs: "세관",
  factory: "공장",
  interchange: "인터체인지",
  lighthouse: "등대",
  reserve: "리저브",
  shoreline: "해안선",
  terminal: "터미널",
  woods: "삼림",
};

const koreanBossNames: Record<string, string> = {
  bossBully: "레샬라",
  bossKojaniy: "슈트르만",
  bossGluhar: "글루하르",
  bossKilla: "킬라",
  bossSanitar: "세니타르",
  bossTagilla: "타길라",
  bossKnight: "나이트",
  bossZryachiy: "즈랴치",
  bossPartisan: "파르티잔",
  bossKolontay: "콜론타이",
  bossKabani: "카반",
};

const koreanMobNames: Record<string, string> = {
  ...koreanBossNames,
  bossBoar: "카반",
  bossBoarClose1: "카반 경호원",
  bossBoarClose2: "카반 경호원",
  bossKolontay: "콜론타이",
  bossTagillaAgro: "타길라",
  bossWedge: "웨지",
  bossWedgeLab: "웨지",
  bossBullyBlackDiv: "블랙 디비전 르샬라",
  blackDivision: "블랙 디비전",
  vsRF: "러시아 연방군",
  vsRFSniper: "러시아 연방군 저격수",
  sectantPriest: "광신도 사제",
  sectantWarrior: "광신도 전사",
  Sentry: "보초병",
  PmcBot: "PMC",
  pmcBotBlackDiv: "블랙 디비전 PMC",
  ExUsec: "USEC 탈영병",
  exUsecFree: "USEC 탈영병",
  infectedScreamer: "감염자 (비명 감염자)",
  infectedTagilla: "감염자 타길라",
  infectedAssault: "감염자 스캐브",
  infectedPmc: "감염자 PMC",
};

const koreanMarkerNames: Record<string, string> = {
  "Gate m": "M 게이트",
  "Gate 3": "3번 출입구",
  "Gate 2": "2번 출입구",
  "Gate 0": "0번 출입구",
  "Gate_o": "O 게이트",
  "Camera Bunker Door": "카메라가 비추는 벙커 문",
  "Office Window": "사무실 창문",
  Cellars: "지하 저장고",
  "Old Road Gate": "구 도로 출입문",
  "RUAF Roadblock": "RUAF 바리케이드",
  "RUAF Roadblock_scav": "RUAF 바리케이드",
  "Sniper Roadblock": "저격수 바리케이드",
  "Factory Shacks": "공장 판잣집",
  "Warehouse 4": "4번 창고",
  "Warehouse 17": "17번 창고",
  "Old Gas Station": "구 주유소",
  "Beyond Fuel Tank": "연료 탱크 너머",
  "Trailer Park": "이동주택 주차장",
  "Trailer Park Workers' Shack": "이동주택 주차장 숙직실",
  "Railroad to Military Base": "군사 기지로 향하는 철도",
  "Railroad To Military Base": "군사 기지로 향하는 철도",
  "Railroad to Tarkov": "타르코프로 향하는 철도",
  "Railroad to Port": "항구로 향하는 철도",
  "Railroad Passage (Flare)": "신호탄 철도 통로",
  "Scav Checkpoint": "스캐브 검문소",
  "Scavs checkpoint": "스캐브 검문소",
  "Military Base CP": "군사 기지 지휘소",
  "Smugglers' Boat": "밀수업자의 보트",
  "Smugglers' Bunker (ZB-1012)": "밀수업자의 벙커 (ZB-1012)",
  "Factory Far Corner": "공장 구석",
  "Scav Base": "스캐브 기지",
  "Scav Base CP": "스캐브 기지 지휘소",
  "Scav Crossroads": "스캐브 교차로",
  "Crossroads": "교차로",
  "Road to Military Base": "군사 기지로 향하는 철도",
  "Railroad Passage": "철도 통로",
  "Gate M": "M 게이트",
  "Gate O": "O 게이트",
  "UN Roadblock": "UN 바리케이드",
  "Scav House": "스캐브 하우스",
  "East Gate": "동쪽 출입문",
  "West Border": "서쪽 경계",
  "South V-Ex": "남쪽 차량 탈출",
  "Coastal South Road": "남쪽 해안 도로",
  "Northern Checkpoint": "북쪽 검문소",
  "Tunnel Shared": "터널",
  "Road at Railway Bridge": "철도 다리 도로",
  "Shoreline V-Ex": "해안선 차량 탈출",
  "Red Rebel": "산악 통로",
  "Hole in the Fence": "울타리의 구멍",
  "Emercom Checkpoint": "에머콤 검문소",
  "Railway Exfil": "철도 탈출구",
  "Scav Camp": "스캐브 캠프",
  "Power Station": "발전소",
  "Nakatani Basement Stairs": "나카타니 지하 계단",
  "Scav Lands": "스캐브 랜드",
  ex_interchange_scav_railway: "철도 탈출구",
  ex_interchange_pmc_saferoom: "울트라 쇼핑몰 안전실",
  ex_interchange_pmc_railway: "철도 탈출구",
  ex_interchange_pmc_emercom: "에머콤 검문소",
  ex_interchange_coop_basement: "지하 주차장 협동 탈출",
  ex_interchange_pmc_sniper: "울타리의 구멍",
  ex_interchange_scav_emercom: "에머콤 검문소",
  ex_interchange_pmc_auto: "철도 탈출구",
  "Hole Exfill": "울타리의 구멍",
  Shorl_free_scav: "해안선 무료 탈출 (SCAV)",
  Shorl_free: "해안선 무료 탈출",
  "Scav_Coastal_South": "남쪽 해안 도로 (SCAV)",
  Nakatani_stairs_free_exit: "나카타니 계단",
  "E1": "E1 탈출구",
  "E2": "E2 탈출구",
  "E3": "E3 탈출구",
  "E4": "E4 탈출구",
  "E5": "E5 탈출구",
  "E6": "E6 탈출구",
  "E7": "E7 탈출구",
  "E8": "E8 탈출구",
  "E9_sniper": "E9 저격수 탈출구",
  "E10_coop": "E10 협동 탈출구",
  heli: "헬기장",
  "Unity": "유니티",
  "Hole in the Fence by the Mountains": "산악 지대 울타리 구멍",
  "Railway Bridge": "철도 다리",
  "Outskirts": "외곽 지역",
  "Customs": "세관",
  "Dorms": "기숙사",
  "Dormitory": "기숙사",
  "Gas Station": "주유소",
  "Wood Cutter": "제재소",
  "Sawmill": "제재소",
  "Chalet": "샬레",
  "Island": "섬",
  "Port": "항구",
  "Green Houses": "온실",
  "Meteo Station": "기상 관측소",
  "Sanatorium 1": "요양원 서관",
  "Sanatorium 2": "요양원 동관",
  "OLI": "올리",
  "IDEA": "이데아",
  "Goshan": "고산",
  "Rail Storage": "철도 창고",
  "Barracks": "병영",
  "Sub Storage": "지하 보관소",
  "MVD": "내무부 건물",
  "tr_customs_reserve_DESC": "세관 ↔ 리저브 환승 지점",
  "tr_customs_factory_DESC": "세관 ↔ 공장 환승 지점",
  "tr_customs_interchange_DESC": "세관 ↔ 인터체인지 환승 지점",
  "tr_customs_shoreline_DESC": "세관 ↔ 해안선 환승 지점",
  "tr_lighthouse_shoreline_DESC": "등대 ↔ 해안선 환승 지점",
  "tr_lighthouse_reserve_DESC": "등대 ↔ 리저브 환승 지점",
  "tr_lighthouse_woods_DESC": "등대 ↔ 삼림 환승 지점",
  "tr_lighthouse_icebreaker_DESC": "등대 ↔ 쇄빙선 환승 지점",
  "tr_interchange_customs_DESC": "인터체인지 ↔ 세관 환승 지점",
  "tr_interchange_streets_DESC": "인터체인지 ↔ 타르코프 시내 환승 지점",
  "DamageType_Landmine": "지뢰",
  "ScavRole/Marksman": "저격 스캐브",
  "Passage between rocks": "바위 사이의 통로",
  "ex_customs_scav_gasstation": "구 주유소",
  "ex_customs_pmc_rail_milbase": "군사 기지로 향하는 철도",
  "ex_customs_pmc_crossroads": "교차로",
  "ex_customs_scav_admin": "스캐브 검문소",
  "ex_customs_scav_crossroads": "스캐브 교차로",
  "ex_customs_coop_boiler": "보일러실 협동 탈출",
  "ex_customs_pmc_flare": "신호탄 철도 통로",
  "ex_customs_scav_rail_milbase": "군사 기지로 향하는 철도",
  "ex_customs_scav_rail_port": "항구로 향하는 철도",
  "ex_customs_scav_rail_tarkov": "타르코프로 향하는 철도",
  "ex_customs_scav_milbase_cp": "군사 기지 지휘소",
  "ex_customs_pmc_trailerpark": "이동주택 주차장",
  "ex_customs_pmc_gasstation": "구 주유소",
  "ex_customs_secret_voron_boat": "밀수업자의 보트",
  "ex_customs_secret_voron_bunker": "밀수업자의 벙커",
  "ZB-016": "ZB-016",
  "ZB-014": "ZB-014",
  "ZB-013": "ZB-013",
  "ZB-1011": "ZB-1011",
  "ZB-1012": "ZB-1012",
  "Old Station": "구 기차역",
  "Mountain Stash": "산악 은닉처",
  wood_sniper_exit: "저격수 출구",
  "RUAF Gate": "RUAF 출입문",
  "Dead Man's Place": "죽은 자의 장소",
  "Factory Gate": "공장 출입문",
  "The Boat": "보트",
  Coastal_South_Road: "남쪽 해안 도로",
  Alpinist_light: "등산로",
  Nothern_Checkpoint: "북쪽 검문소",
  Scav_Underboat_Hideout: "선박 아래 은신처 (SCAV)",
  Scav_Hideout_at_the_grotto: "동굴 은신처 (SCAV)",
  Scav_Industrial_zone: "공업 지대 (SCAV)",
  tunnel_shared: "터널",
  RedRebel_alp: "산악 통로",
  "Adm Basement": "행정동 지하",
  Tunnel: "터널",
  "Rock Passage": "바위 통로",
  Lighthouse: "등대",
  "Smugglers_Trail_coop": "밀수업자의 길 협동 탈출",
  "Svetliy Dead End": "스베틀리 막다른 길",
  "Wrecked Road": "난파된 도로",
  "CCP Temporary": "임시 CCP",
  "Scav Road to Customs": "세관으로 향하는 도로 (SCAV)",
  "Road to Customs": "세관으로 향하는 도로",
  "Ruined House Fence": "폐허가 된 집 울타리",
  "Pier Boat": "부두 보트",
  Exit1: "1번 출입구",
  Exit2: "2번 출입구",
  Exit3: "3번 출입구",
  Exit4: "4번 출입구",
  EXFIL_Train: "열차 탈출구",
  EXFIL_vent: "환기구 탈출구",
  EXFIL_Bunker_D2: "벙커 D-2",
  EXFIL_Bunker: "벙커 출입구",
  EXFIL_ScavCooperation: "스캐브 협동 탈출구",
  Scav_coop_exit: "스캐브 협동 탈출구",
  Sniper_exit: "저격수 출구",
  Unity_free_exit: "유니티 출구",
  Sandbox_VExit: "그라운드 제로 차량 탈출구",
  lab_Hangar_Gate: "격납고 게이트",
  lab_Elevator_Med: "의료 구역 엘리베이터",
  lab_Elevator_Cargo: "화물 구역 엘리베이터",
  lab_Elevator_Main: "주 엘리베이터",
  lab_Parking_Gate: "주차장 게이트",
  lab_Under_Storage_Collector: "지하 보관소 수집 구역",
  lab_Vent: "환기구",
  labir_exit: "미궁 출구",
  labyrinth_secret_tagilla_key: "타길라 열쇠 출구",
  Hazard: "위험 요소",
  ZoneDormitory: "기숙사",
  ZoneGasStation: "주유소",
  ZoneScavBase: "스캐브 기지",
  ZoneWoodCutter: "제재소",
  ZoneWoodCutterMain: "제재소",
  Zone_Island: "섬",
  ZoneChalet: "샬레",
  ZonePort: "항구",
  ZoneGreenHouses: "온실",
  ZoneMeteoStation: "기상 관측소",
  ZoneSanatorium1: "요양원 서관",
  ZoneSanatorium2: "요양원 동관",
  ZoneForestSpawn: "숲",
  ZoneCenterBot: "울트라 쇼핑몰 중앙",
  ZoneOLI: "올리",
  ZoneIDEA: "이데아",
  ZoneGoshan: "고산",
  ZoneRailStrorage: "철도 창고",
  ZonePTOR2: "수송대 정비소",
  ZoneBarrack: "병영",
  ZoneSubStorage: "지하 보관소",
  ZoneClimova: "클리모바 거리",
  ZoneMvd: "내무부 건물",
};

function humanize(value?: string) {
  if (!value) return "이름 없는 지점";
  const normalized = value
    .replace(/^ex_[a-z0-9-]+_/, "")
    .replace(/_DESC$|_Name$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_/]+/g, " ")
    .trim();
  const translated = koreanMarkerNames[value] ?? koreanMarkerNames[normalized];
  if (translated) return translated;
  if (/^switch(?:_|\s)/i.test(value)) {
    const key = value.toLowerCase();
    if (key.includes("call_button")) return "엘리베이터 호출 버튼";
    if (key.includes("floor_button")) return "층 선택 버튼";
    if (key.includes("exfil")) return "탈출 활성화 스위치";
    if (key.includes("alarm")) return "경보 스위치";
    if (key.includes("power") || key.includes("electric")) return "전원 스위치";
    if (key.includes("lever")) return "레버";
    if (key.includes("valve")) return "밸브";
    if (key.includes("gaz_cutter")) return "가스 절단기";
    return "작동 스위치";
  }
  if (/^tr_|_TRANSIT_/i.test(value)) return "환승 지점";
  if (/^Zone/i.test(value)) return "출현 구역";
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value)) return "스폰 지점";
  if (/^ex_/i.test(value)) return "탈출 지점";
  return "기타 지점";
}

const koreanExtractNames: Record<string, string> = {
  "ex_customs_scav_gasstation": "구 주유소", "ex_customs_pmc_rail_milbase": "리저브행 철도",
  "ex_customs_pmc_crossroads": "교차로", "ex_customs_scav_admin": "관계자용 출입구",
  "ex_customs_scav_crossroads": "교차로", "ex_customs_coop_boiler": "보일러실 지하실 (협동)",
  "ex_customs_pmc_flare": "신호탄 철도 통로", "ex_customs_scav_rail_milbase": "리저브행 철도",
  "ex_customs_scav_rail_port": "항구로 향하는 철도", "ex_customs_scav_rail_tarkov": "타르코프로 향하는 철도",
  "ex_customs_scav_medgate": "의료 블록 근처 게이트", "ex_customs_pmc_zb1013": "ZB-013",
  "ex_customs_pmc_zb1011": "ZB-1011", "ex_customs_scav_zb1011": "ZB-1011",
  "ex_customs_scav_milbase_cp": "리저브 검문소", "ex_customs_pmc_trailerpark": "이동주택 주차장",
  "ex_customs_scav_trailerpark": "이동주택 주차장",
  "ex_customs_pmc_auto": "기숙사 V-Ex 차량", "ex_customs_pmc_gasstation": "구 주유소",
  "ex_customs_secret_voron_boat": "밀수업자의 보트", "ex_customs_secret_voron_bunker": "밀수업자의 벙커 (ZB-1012)",
  "RUAF Roadblock_scav": "RUAF 바리케이드", "RUAF Gate": "RUAF 바리케이드",
  "Gate m": "의무 천막 게이트", "Gate 3": "3번 게이트", "Gate 2": "2번 게이트", "Gate 0": "0번 게이트", "Gate_o": "안뜰 문(Courtyard Gate)",
  "Cellars": "지하실", "Camera Bunker Door": "카메라가 있는 벙커 문", "Office Window": "사무실 창문",
  "factory_secret_ark": "밀수업자의 통로 (비밀)", "UN Roadblock": "UN 바리케이드", "Old Station": "오래된 기차역",
  "Scav House": "스캐브 거주지", "West Border": "서쪽 경계", "Mountain Stash": "산속 은닉함",
  "wood_sniper_exit": "저격수 출구", "Outskirts": "외곽", "East Gate": "동쪽 출입문",
  "Dead Man's Place": "죽은 자의 공간", "Factory Gate": "우정의 다리 (협동)", "The Boat": "보트", "South V-Ex": "남쪽 차량 탈출구",
  "EXFIL_Train": "무장 열차", "Coastal_South_Road": "남쪽 해안 도로", "Scav_Coastal_South": "남쪽 해안 도로",
  "Shorl_free_scav": "해안선으로 향하는 길", "Shorl_free": "해안선으로 향하는 길", "Alpinist_light": "산악 통로", "Alpinist": "산악 통로",
  "Nothern_Checkpoint": "북쪽 검문소", "Scav_Underboat_Hideout": "선박 아래 은신처",
  "Scav_Hideout_at_the_grotto": "동굴 은신처", "Scav_Industrial_zone": "산업 지대 게이트", "tunnel_shared": "측면 터널 (협동)",
  "Adm Basement": "관리동 지하실", "RedRebel_alp": "등산로", "Tunnel": "터널", "Rock Passage": "바위 통로",
  "Lighthouse": "등대", "Smugglers_Trail_coop": "밀수업자의 길 협동 탈출구", "Svetliy Dead End": "막다른 길",
  "Wrecked Road": "무너진 도로", "CCP Temporary": "임시 CCP", "Scav Road to Customs": "세관으로 향하는 도로",
  "Road to Customs": "세관으로 향하는 길", "Ruined House Fence": "폐허가 된 집 울타리",
  "RWing Gym Entrance": "휴양시설 동관 체육관 입구", "Pier Boat": "정박된 보트", "Road_at_railbridge": "철도 다리",
  "Shorl_V-Ex": "북쪽 도로 V-Ex 차량", "EXFIL_vent": "난방 파이프", "EXFIL_Bunker_D2": "D-2",
  "EXFIL_Bunker": "밀폐된 벙커 출입문", "Exit1": "통제선 울타리", "Exit2": "밀폐된 창고 출입문",
  "Exit3": "하수구 맨홀", "Exit4": "난방 파이프", "EXFIL_ScavCooperation": "스캐브 랜드 (협동)",
  "Scav_coop_exit": "스캐브 검문소 (협동)", "Sniper_exit": "미라 대로", "Unity_free_exit": "유니티 출구",
  "Sandbox_VExit": "경찰 저지선 차량 탈출구 (유료)", "Nakatani_stairs_free_exit": "Nakatani 지하 계단",
  "E1": "스틸로베이트 빌딩 엘리베이터", "E2": "하수도 강변", "E3": "파손된 주택",
  "E4": "추락 현장", "E5": "붕괴된 크레인", "E6": "스캐브 검문소", "E7": "엑스포 검문소",
  "E8": "E8 탈출구", "E9_sniper": "클리모프 거리 (신호탄)",
  "Exit_E10_coop": "파인우드 지하실 (협동)", "scav_e1": "지하 묘지 하강로",
  "scav_e2": "지하 묘지 입구", "scav_e3": "환기구", "scav_e4": "하수도 맨홀",
  "scav_e5": "캄차츠카야 아치 근처", "scav_e6": "스캐브 검문소",
  "scav_e7": "카디널 아파트 단지 주차장", "scav_e8": "클리모프 쇼핑몰 탈출구",
  "E8_yard": "안뜰", "E7_car": "프리모르스키 대로 택시 V-Ex", "streets_secret_onyx": "오닉스 탈출구",
  "groundzero_secret_adaptation": "Tartowers 분양 사무소 (비밀)",
  "woods_secret_minefield": "타르코프행 철교 (비밀)", "lighthouse_secret_minefield": "호숫가 통로 (비밀)",
  "reserve_secret_minefield": "삼림으로 나가는 출구 (비밀)", "un-sec": "북쪽 UN 바리케이드",
  "Lighthouse_pass": "등대로 향하는 길", "shoreline_secret_heartbeat": "산악 벙커 (비밀)",
  "ex_interchange_scav_railway": "철도 이탈지점", "ex_interchange_pmc_railway": "철도 이탈지점",
  "ex_interchange_pmc_saferoom": "안전실 이탈지점", "ex_interchange_pmc_emercom": "EMERCOM 검문소",
  "ex_interchange_scav_emercom": "EMERCOM 검문소", "ex_interchange_coop_basement": "스캐브 캠프 탈출구 (협동)",
  "ex_interchange_pmc_sniper": "강변 통로 (신호탄)", "ex_interchange_pmc_auto": "발전소 V-Ex 차량", "Hole Exfill": "울타리 틈새",
  "lab_Hangar_Gate": "격납고 게이트", "lab_Elevator_Med": "의무동 엘리베이터",
  "lab_Elevator_Cargo": "화물 엘리베이터", "lab_Elevator_Main": "중앙 엘리베이터",
  "lab_Parking_Gate": "주차장 게이트", "lab_Under_Storage_Collector": "지하 보관소 수집 구역", "lab_Vent": "환기구",
  "labir_exit": "지상으로 향하는 길", "labyrinth_secret_tagilla_key": "아리아드네의 길", "Heli": "헬리콥터",
};

function translateMarkerName(value?: string, fallback = "") {
  if (!value) return fallback;
  if (/[가-힣]/.test(value)) return value;
  const cleaned = value.trim();
  if (koreanExtractNames[cleaned]) return koreanExtractNames[cleaned];
  return koreanMarkerNames[cleaned] ?? koreanMarkerNames[humanize(cleaned)] ?? (fallback || humanize(cleaned));
}

function translateTransitName(value: string | undefined, mapName: string, index: number) {
  if (value && /[가-힣]/.test(value)) return value;
  const route = value?.match(/(?:^tr_|^)([a-z-]+)_([a-z-]+)_DESC$/i);
  const mapNames: Record<string, string> = {
    customs: "세관", factory: "공장", woods: "삼림", shoreline: "해안선", reserve: "리저브",
    interchange: "인터체인지", lighthouse: "등대", streets: "타르코프 시내", "streets-of-tarkov": "타르코프 시내",
    icebreaker: "쇄빙선",
  };
  if (route) {
    const from = mapNames[route[1].toLowerCase()];
    const to = mapNames[route[2].toLowerCase()];
    if (from && to) return `${from} ↔ ${to} 환승 지점`;
  }
  return `${mapName} 환승 지점 ${index + 1}`;
}

function stationaryWeaponLabel(id: string | undefined, index: number) {
  if (id === "5cdeb229d7f00c000e7ce174") return "NSV 중기관총";
  if (id === "5d52cc5ba4b9367408500062") return "AGS-30 자동 유탄 발사기";
  return `고정 무기 ${index + 1}`;
}

export function toMapOptions(maps: TarkovMap[], catalog: MapCatalogEntry[]): MapOption[] {
  return catalog.flatMap((entry) => {
    const image = entry.maps?.find((map) => map.projection === "interactive" && map.svgPath && map.bounds);
    const map = maps.find((candidate) => candidate.normalizedName === entry.normalizedName);
    if (!image?.svgPath || !image.bounds || !map) return [];

    const fileName = image.svgPath.split("/").pop();
    if (!fileName) return [];
    const name = map.name && !map.name.endsWith(" Name") ? map.name : "";
    const [viewWidth, viewHeight] = image.viewBox ?? [16, 9];
    return [{
      ...map,
      displayName: koreanMapNameOverrides[map.normalizedName] ?? koreanMapNames[map.normalizedName] ?? (name || map.normalizedName),
      imagePath: `/maps/svg/${fileName}`,
      bounds: image.bounds,
      coordinateRotation: image.coordinateRotation ?? 0,
      aspectRatio: viewWidth / viewHeight,
    }];
  });
}

export function getMapMarkers(map: TarkovMap): MapMarker[] {
  const markers: MapMarker[] = [];
  const add = (category: MarkerCategoryId, id: string, label: string, position?: MapPosition, groupId?: string) => {
    if (position && Number.isFinite(position.x) && Number.isFinite(position.z)) {
      markers.push({ id, groupId, category, label, position });
    }
  };

  map.extracts?.forEach((point, index) => {
    const mapName = koreanMapNameOverrides[map.normalizedName] ?? map.normalizedName;
    const markerId = `extract:${point.id ?? index}`;
    const label = map.normalizedName.startsWith("ground-zero") && point.name === "UN Roadblock"
      ? "에머콤 검문소"
      : translateMarkerName(point.name, `${mapName} 탈출 지점 ${index + 1}`);
    const isWoodsFactoryGate = map.normalizedName === "woods" && point.name === "Factory Gate";
    const position = isWoodsFactoryGate ? { ...point.position, x: -339.31, z: 367.175 } : point.position;
    const isLighthouseSideTunnel = map.normalizedName === "lighthouse" && point.name === "tunnel_shared";
    if (/coop|cooperation/i.test(point.name ?? "") || isWoodsFactoryGate || isLighthouseSideTunnel) {
      add("coopExtracts", markerId, label, position);
    } else if (point.faction === "pmc") {
      add("pmcExtracts", markerId, label, position);
    } else if (point.faction === "scav") {
      add("scavExtracts", markerId, label, position);
    } else {
      add("pmcExtracts", `${markerId}:pmc`, label, position, markerId);
      add("scavExtracts", `${markerId}:scav`, label, position, markerId);
    }
  });
  map.spawns?.forEach((point, index) => {
    if (point.categories?.includes("sniper") || /snipe|sniper/i.test(point.zoneName ?? "")) {
      add("sniperScavs", `sniper:${index}`, `저격 SCAV · ${point.zoneName ? humanize(point.zoneName) : `지점 ${index + 1}`}`, point.position);
      return;
    }
    const sides = new Set(point.sides ?? []);
    const sideLabel = point.zoneName ? humanize(point.zoneName) : `스폰 ${index + 1}`;
    if (sides.has("pmc") || sides.has("all")) add("pmcSpawns", `spawn:pmc:${index}`, `PMC · ${sideLabel}`, point.position);
    if (sides.has("scav") || sides.has("all")) add("scavSpawns", `spawn:scav:${index}`, `SCAV · ${sideLabel}`, point.position);
    return;
  });
  map.bosses?.forEach((boss, bossIndex) => {
    const bossName = koreanMobNames[boss.mob ?? ""] ?? translateMarkerName(boss.mob, "보스");
    boss.spawnLocations?.forEach((location, locationIndex) => {
      location.positions?.forEach((position, positionIndex) => {
        add("bosses", `boss:${bossIndex}:${locationIndex}:${positionIndex}`, `${bossName} · ${humanize(location.name)}`, position);
      });
    });
  });
  map.lootContainers?.forEach((point, index) => {
    const rawContainer = point.lootContainer;
    const containerId = typeof rawContainer === "string" ? rawContainer : rawContainer?.id ?? "unknown";
    const containerName = lootContainerLabel(containerId, typeof rawContainer === "object" ? rawContainer?.name : undefined, typeof rawContainer === "object" ? rawContainer?.normalizedName : undefined);
    add(`lootContainer:${containerId}`, `container:${containerId}:${index}`, `${containerName} · ${index + 1}`, point.position);
  });
  map.lootLoose?.forEach((point, index) => add("lootLoose", `loot:${index}`, `바닥 아이템 ${index + 1}`, point.position));
  map.hazards?.forEach((point, index) => add("hazards", `hazard:${point.id ?? index}`, translateMarkerName(point.name ?? point.hazardType, `위험 지역 ${index + 1}`), point.position));
  map.switches?.forEach((point, index) => add("switches", `switch:${point.id ?? index}`, humanize(point.name), point.position));
  map.transits?.forEach((point, index) => add("transits", `transit:${point.id ?? index}`, translateTransitName(point.description ?? point.id, koreanMapNameOverrides[map.normalizedName] ?? "지도", index), point.position));
  map.stationaryWeapons?.forEach((point, index) => add("stationaryWeapons", "weapon:" + (point.stationaryWeapon ?? index), stationaryWeaponLabel(point.stationaryWeapon, index), point.position));
  map.btrStops?.forEach((point, index) => add("btrStops", `btr:${point.id ?? index}`, humanize(point.name), point));

  return markers;
}

export function projectMapMarker(
  position: MapPosition,
  bounds: MapOption["bounds"],
  coordinateRotation = 0,
) {
  const [[cornerAX, cornerAZ], [cornerBX, cornerBZ]] = bounds;
  const radians = (coordinateRotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const rotate = ([x, z]: [number, number]): [number, number] => [
    x * cos - z * sin,
    x * sin + z * cos,
  ];
  const corners = [
    rotate([cornerAX, cornerAZ]),
    rotate([cornerAX, cornerBZ]),
    rotate([cornerBX, cornerAZ]),
    rotate([cornerBX, cornerBZ]),
  ];
  const [rotatedX, rotatedZ] = rotate([position.x, position.z]);
  const xs = corners.map(([x]) => x);
  const zs = corners.map(([, z]) => z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const left = ((rotatedX - minX) / (maxX - minX)) * 100;
  const top = ((maxZ - rotatedZ) / (maxZ - minZ)) * 100;
  if (left < -2 || left > 102 || top < -2 || top > 102) return null;
  return { left: Math.max(0, Math.min(100, left)), top: Math.max(0, Math.min(100, top)) };
}
