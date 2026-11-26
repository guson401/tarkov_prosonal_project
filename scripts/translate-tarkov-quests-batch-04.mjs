import { readFile, writeFile } from "node:fs/promises";

const file = "resources/quests/quests.en.json";
const data = JSON.parse(await readFile(file, "utf8"));
const translations = new Map([
  [34221, {
    titleKo: "구원의 열쇠",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕하세요. 테라그룹 연구소의 관리자 출입 카드를 꼭 구해야 합니다. 카드 한 장도 손에 넣기 얼마나 어려운지 잘 아시잖아요. 정비사가 군용 장비와 카드를 교환할 의향이 있다고 들었지만, 지금은 물품을 모을 인력이 부족합니다. 생사가 걸린 문제예요. 도와주시겠습니까?", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "테라그룹 연구소 출입 카드 건네기\n테라그룹 연구소 출입 카드(바이올렛) 건네기\n테라그룹 연구소 출입 카드(옐로) 건네기\n테라그룹 연구소 출입 카드(레드) 건네기\n테라그룹 연구소 출입 카드(그린) 건네기\n테라그룹 연구소 출입 카드(블루) 건네기\n테라그룹 연구소 출입 카드(블랙) 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "테라피스트 평판 +0.15\n26×75mm 플레어 카트리지(애시드 그린) 5개\nM.U.L.E. 자극제 주사기 5개\neTG-체인지 재생 자극제 주사기 5개\nSJ1 TGLabs 전투 자극제 주사기 5개\nSJ6 TGLabs 전투 자극제 주사기 5개\n테라피스트 상인 평판 등급 1에서 26×75mm 플레어 카트리지(애시드 그린) 물물교환 해금\n‘구원의 열쇠’ 업적 해금", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "열쇠 카드는 정비사 상인 평판 등급 1에서 6-STEN-140-M 군용 배터리와 교환할 수 있습니다. 교환에 필요한 배터리 수량은 열쇠 카드마다 다릅니다.\n\n커스텀에서는 레이드마다 배터리가 다음 위치에 확정 생성됩니다.\n3층 기숙사 건물 옥상\n신 주유소 내부\n스캐브 기지 건물 2층(ZB-1013 탈출 지점 건물)\n\n각 장소는 스캐브 레이더가 지키고 있습니다.", translationSource: "English wiki source translation" },
    ],
  }],
  [24366, {
    titleKo: "친절한 눈의 아가씨",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕하세요, 용병! 스캐브 지도자들과 협상을 시도해보면 어떨까 생각했어요. 크리스마스는 좋은 기회잖아요. 이렇게 해보죠. 지도자가 가져갈 수 있는 곳의 트리 아래에 선물을 두는 거예요. 선물이 누구에게서 왔는지는 그 깡패들도 알 수 있어야 합니다. 싸우는 것보다 누구와 친구가 되는 게 이득인지 직접 판단하게 하자는 거죠… 무슨 말인지 아시겠죠?", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "라이트하우스 크리스마스트리 아래 골든 넥 체인 숨기기\n커스텀 크리스마스트리 아래 호스 피규어 숨기기\n리저브 크리스마스트리 아래 체인릿 숨기기\n인터체인지 크리스마스트리 아래 앤티크 티팟 숨기기\n쇼어라인 크리스마스트리 아래 앤티크 베이스 숨기기\n우즈 크리스마스트리 아래 캣 피규어 숨기기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+16,600 경험치\n테라피스트 평판 +0.01\n80,000 루블\n정보 센터 1레벨일 때 84,000 루블\n정보 센터 2레벨일 때 92,000 루블\n슈거 팩 5개\n피어스 해츨링 문샤인 1병\n\n잘 해냈군요, 젊은이.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "크리스마스트리는 각 지역의 다음 위치에 있습니다.\n\n커스텀\n기숙사 안뜰\n\n리저브\nE2 벙커 옆\n\n라이트하우스\n올드 랜딩 스캐브 탈출 지점\n\n인터체인지\n스캐브 캠프 내부\n\n쇼어라인\n리조트 중앙부 내부\n\n우즈\n호수 동쪽 제재소 옆, 군사 캠프로 가는 길에 있는 부두입니다. 해안가를 달릴 때 잘 살펴보세요.", translationSource: "English wiki source translation" },
    ],
  }],
  [38949, {
    titleKo: "인생의 교훈",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "뭐—아, 자네였군. 들어와, 거기 서 있지만 말고… 배당금을 날린 모양이야… 루카가 연락을 안 해. 그 빌어먹을 자식! 봉쇄 구역 밖에서 무슨 일이 벌어지는지 확인조차 못 하고 있어… 그쪽을 살펴볼 사람이 하나도 없다고. 애초에 USEC 기지가 없었던 건 아닐까? 루카 그 자식에게 분대가 있기는 한 걸까? 그런데 우린 아무것도 눈치채지 못했어. 자네는 눈썰미가 좋잖아… 젠장. 좋아… 여기서 저 망할 놈들을 잡을 방법은 없어. 술에 취했다가 정신 차릴 때까지 새 계획은 기대하지 마. 뭐, 돕고 싶다고? 그럼 술이나 더 가져와…", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "BEAR PMC로만 수락할 수 있습니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "타르코프스카야 보드카 12병 건네기\n댄 재키얼 위스키 20병 건네기\n피어스 해츨링 문샤인 20병 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "지구력 스킬 레벨 +1\n근력 스킬 레벨 +1\n신진대사 스킬 레벨 +1\n카리스마 스킬 레벨 +1\n지능 스킬 레벨 +1\n은신처 관리 스킬 레벨 +1\n제작 스킬 레벨 +1\n탄창 조작 스킬 레벨 +1\n무기 문제 해결 스킬 레벨 +1\n\n이쪽이야… 이쪽이라고, 이 멍청아! 한 잔 더 하고 싶으면 여기 앉아. 내가 살아온 얘기를 들려줄게… 어쩌면 자네가 나처럼 비참하게 살지 않도록 도움이 될지도 모르지.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "", translationSource: "English wiki source translation" },
    ],
  }],
  [47170, {
    titleKo: "새로운 클래식",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "관중들이 폭발물을 사용하는 새로운 경기 방식에 완전히 빠져들었어. 우리가 그동안 놓치고 있던 게 바로 이런 제대로 된 흥행작이자 명작이었나 봐! 단골 관중 한 명은 경기를 보고 데자뷔를 느꼈다고 하더군. 하지만 선수들 입장에서는 상황이 확실히 달라졌어. 이제는 상대를 놓치면 안 돼. 상대가 폭탄을 들고 있고 설치를 막을 수 있는 사람이 너뿐이면 어떡하겠어? 그러니 네 둔한 움직임 때문에 하늘 높이 날아가고 싶지 않다면 보조 무기를 기억해. 이번 훈련은 분명 도움이 될 거야.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "블래스트갱 모드에서 권총으로 적 5명 처치하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+12,000 경험치\n400,000 루블\nGP 코인 40개\n에코 벨리 크레이트 1개\n전투 포인트 2점", translationSource: "English wiki source translation" },
    ],
  }],
  [33861, {
    titleKo: "새로운 희망",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕하세요, 친구. 존 도를 가로막아 데이터를 확보하려 했지만 계속 실패하고 있습니다. 스키어의 부하들 때문이죠, 그… 흠, 또 화를 내버렸군요. 존 도가 목격된 장소를 확인해볼 수 있습니다. 뭔가 단서가 있을지도 모르죠. 다시 도와주시겠어요? 쇼어라인으로 가세요. 그 용의자가 사람들을 지역 밖으로 이동시키는 차량 근처에서 목격됐습니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "쇼어라인 밀수꾼 기지에서 언허드의 노트북 찾기 및 확보하기\n노트북 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+47,300 경험치\n피스키퍼 평판 +0.02\n1,000달러\n정보 센터 1레벨일 때 1,050달러\n정보 센터 2레벨일 때 1,150달러\n메탈 연료 탱크 2개\n군용 파워 필터 2개\n\n잘하셨습니다! 또다시 기대를 저버리지 않으셨군요. 노트북은 쉽게 해킹할 수 있으면 좋겠네요.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "쇼어라인의 밀수꾼 기지에서 언허드의 노트북을 찾아야 합니다. 기지 곳곳의 여러 장소에 생성될 수 있습니다.\n\n지도에 표시된 밀수꾼 기지 위치\n생성 위치 1: 남서쪽 창고의 의자 위\n생성 위치 2: 남쪽 빨간 선적 컨테이너 계단 아래\n생성 위치 3: 북서쪽 창고의 소파와 안락의자 사이\n생성 위치 4: 기지 중앙 흰색 천막 아래 노란 트럭 안", translationSource: "English wiki source translation" },
    ],
  }],
]);

for (const quest of data.quests) {
  const translated = translations.get(quest.id);
  if (!translated) continue;
  quest.titleKo = translated.titleKo;
  quest.sectionsKo = translated.sectionsKo;
  const objectives = quest.sectionsKo.find((section) => section.title === "Objectives");
  quest.objectivesKo = objectives?.text.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
}

await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Saved ${translations.size} translated quests.`);
