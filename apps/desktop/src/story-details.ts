export type TicketEnding = "Savior" | "Debtor" | "Survivor" | "Fallen";

export const ticketEndings: Record<TicketEnding, { premise: string; achievement: string; steps: string[]; lockouts: string }> = {
  Savior: {
    premise: "Mr. Kerman과 협력해 TerraGroup의 주요 증거를 확보하고 전달합니다.",
    achievement: "Savior · Little Triumphs (minor evidence 36개 모두 전달 시)",
    steps: ["Falling Skies에서 장갑 케이스를 Prapor에게 전달", "Mr. Kerman의 협력 제안을 수락하고 증거 수집 경로 선택", "40 Physical Bitcoins를 준비해 RFID 장비 관련 서비스를 진행", "TerraGroup 주요 증거 8개를 Mr. Kerman에게 전달하고 완료 확인", "Little Triumphs까지 노린다면 minor evidence 36개를 모두 전달", "Fence 평판 4.0, BTR Driver 평판 0.4, Solar Power 1 조건을 준비"],
    lockouts: "주요 증거를 전달한 뒤에는 minor evidence 제출이 막히는 구간이 있습니다. 확인 대화 전에 누락된 문서와 미완료 챕터를 확인하세요.",
  },
  Debtor: {
    premise: "Mr. Kerman 경로에서 Lightkeeper에게 도움을 요청하고 빚을 갚는 경로입니다.",
    achievement: "Debtor",
    steps: ["Falling Skies에서 장갑 케이스를 Prapor에게 전달해 Lighthouse/Lightkeeper 경로를 엽니다", "Mr. Kerman의 제안을 수락하고 필요한 주요 증거를 전달", "Terminal 탈출 방법을 물은 뒤 Lightkeeper에게 지원을 요청", "Woods에서 PMC 30명 처치 및 PMC 인식표 100개 전달 조건 진행", "Lighthouse의 표식 방에 컬티스트 부적을 보관하고 Lightkeeper에게 보고", "Lightkeeper의 Terminal 접근 경로를 완료"],
    lockouts: "Lightkeeper 경로는 선행 챕터·상인 진행도와 장비 접근 조건에 묶입니다. 목표와 대화 선택이 바뀌면 이전 경로와 병행되지 않을 수 있습니다.",
  },
  Survivor: {
    premise: "Prapor와 거래해 대가를 치르고 Terminal로 향하는 경로입니다.",
    achievement: "Survivor",
    steps: ["Mr. Kerman의 협력 제안을 거절하거나 Prapor 경로로 전환", "Falling Skies에서 장갑 케이스를 Prapor에게 넘겼다면 300,000,000 RUB, 보유했다면 500,000,000 RUB 경로를 준비", "Prapor의 제한 시간 임무를 완료하고 Terminal 접근 비용을 지급", "지정된 Terminal 접근 단계와 RFID 카드 절차를 완료"],
    lockouts: "장갑 케이스를 누구에게 넘겼는지에 따라 루블 목표가 달라집니다. Prapor의 제한 시간 임무를 실패하면 추가 보상 조건이나 Secure Container Kappa 제출 경로가 열릴 수 있습니다.",
  },
  Fallen: {
    premise: "Mr. Kerman과 협력한다고 한 뒤 증거를 넘기지 않고 배신하는 경로입니다.",
    achievement: "Fallen",
    steps: ["Mr. Kerman의 협력 제안을 수락", "증거를 모으되 주요 증거를 넘기지 않거나 전달을 거부", "Mr. Kerman을 배신하고 증거를 보유", "Prapor에게 1,000,000 USD를 지급하는 Terminal 접근 경로를 진행"],
    lockouts: "주요 증거 전달 선택은 되돌리기 어려우며 Savior 경로와 갈라집니다. 증거 전달 확인을 완료하지 마세요.",
  },
};

export const storyChapterWiki: Record<string, string> = {
  Tour: "https://escapefromtarkov.fandom.com/wiki/Tour",
  "Falling Skies": "https://escapefromtarkov.fandom.com/wiki/Falling_Skies",
  "The Ticket": "https://escapefromtarkov.fandom.com/wiki/The_Ticket",
  Batya: "https://escapefromtarkov.fandom.com/wiki/Batya",
  "Accidental Witness": "https://escapefromtarkov.fandom.com/wiki/Accidental_Witness",
  "Blue Fire": "https://escapefromtarkov.fandom.com/wiki/Blue_Fire",
  Boreas: "https://escapefromtarkov.fandom.com/wiki/Boreas",
  "The Labyrinth": "https://escapefromtarkov.fandom.com/wiki/The_Labyrinth_(story_chapter)",
  "The Unheard": "https://escapefromtarkov.fandom.com/wiki/The_Unheard",
  "They Are Already Here": "https://escapefromtarkov.fandom.com/wiki/They_Are_Already_Here",
};

export const storyChapterNotes: Record<string, { overview: string; choices?: string; achievements?: string[] }> = {
  Tour: { overview: "Ground Zero에서 탈출한 뒤 Therapist와 상인들을 거쳐 지역과 상인을 순차적으로 개방하는 입문 스토리입니다. 일부 지역은 생존 탈출 대신 여러 차례 방문으로 진행할 수 있습니다.", achievements: ["Pathfinder"] },
  "Falling Skies": { overview: "Woods에 추락한 항공기를 조사하고 비행 기록·승무원 자료를 Prapor에게 전달해 장갑 케이스의 행방을 추적합니다.", choices: "장갑 케이스를 보유하면 Just Business, Prapor에게 직접 전달하거나 발견 사실을 숨긴 채 전달하면 Man of His Word 업적 분기로 이어집니다. 선택은 The Ticket의 엔딩 진행에 영향을 줍니다.", achievements: ["Just Business", "Man of His Word"] },
  "The Ticket": { overview: "Falling Skies에서 이어지는 최종 탈출 스토리입니다. Mr. Kerman·Prapor·Lightkeeper 중 누구의 도움을 받아 어떤 대가를 치르는지에 따라 네 엔딩으로 분기합니다." },
  Batya: { overview: "Tarkov에 투입된 BEAR 특수부대 Bogatyr 분대의 흔적과 임무를 조사합니다. 근력·경기관총 레벨 및 여러 맵의 단서를 요구합니다.", achievements: ["This Is All (Not) Coincidence"] },
  "Accidental Witness": { overview: "Customs의 Kozlov 협박 차량에서 시작해 빚을 추적하고, Streets와 Shoreline에서 Skier의 연루 및 관련 증거를 조사합니다.", achievements: ["Pay Your Debt"] },
  "Blue Fire": { overview: "도시 전자 장비를 마비시킨 청색 섬광의 정체와 EMP 공격, Item 1156 기술의 배후를 추적하는 스토리입니다." },
  Boreas: { overview: "Woods의 조난 신호와 장비를 조사해 Paradigm Shipping의 쇄빙선 Boreas로 향합니다. Icebreaker 위치 탐사와 잠긴 구역 조사가 추가 단서입니다.", achievements: ["Part of the Ship, Part of the Crew", "Cracks in the Ice"] },
  "The Labyrinth": { overview: "Health Resort 지하에 숨겨진 TerraGroup 시설과 그 안의 연구원·BEAR 부대에 무슨 일이 있었는지 조사합니다.", achievements: ["Theseus"] },
  "The Unheard": { overview: "TerraGroup과 The Unheard의 계획, 정화 작전과 연료 촉매 단서를 따라가는 독립 스토리 챕터입니다.", achievements: ["Trail of Breadcrumbs"] },
  "They Are Already Here": { overview: "Eye of the World 표식과 컬티스트 피해자를 추적하고 ARRS 통신 시설의 자료를 확보합니다.", achievements: ["Through Another's Eyes", "When the Light Fades"] },
};
