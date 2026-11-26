import { readFile, writeFile } from "node:fs/promises";

const file = "resources/quests/quests.en.json";
const data = JSON.parse(await readFile(file, "utf8"));
const translations = new Map([
  [25692, {
    titleKo: "방송 - 파트 1",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "예거와 상인 평판 등급 2를 달성해야 합니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "라이트하우스에서 숨겨진 녹음 스튜디오 찾기\n스튜디오 안에 신호 방해기 설치하기\n참고: ‘설치’ 목표는 ‘찾기’ 목표를 완료한 뒤 표시됩니다.", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+10,000 경험치\n탄약 상자 1개", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "이 퀘스트에서는 라이트하우스의 숨겨진 녹음 스튜디오를 찾아 신호 방해기를 설치해야 합니다. 스튜디오에 들어가려면 수술실 열쇠가 필요합니다. 스튜디오는 북쪽 수처리 시설 구역에 있는 사무실 건물 1의 1층에서 찾을 수 있습니다.\n\n지도에 표시된 건물 위치\n수처리 시설 구역의 사무실 건물 1\n건물 북동쪽 구석에 있는 스튜디오\n방 안쪽", translationSource: "English wiki source translation" },
    ],
  }],
  [6786, {
    titleKo: "화학 - 파트 3",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "기숙사에서 찾은 봉투에는 화학식이 들어 있었어. 플래시 드라이브에는 반응 과정이 적혀 있었고. 이 분야를 잘 아는 사람을 찾아 물어봤더니, 폴리켐에서 파란 액체에 이것저것을 섞어 비슷한 걸 만들었다더군. 미안, 난 학교에서 화학을 안 배웠어! 화학 물질이니 원자가니 이상한 결합이니, 그런 건 질색이야! 하하. 그래도 단어 몇 개는 기억나네. 그때 학교 수업이 꽤 인상적이었나 봐! 아무튼 기록에 적힌 실험을 확인해야 해. 그러면 이 일이 새로운 국면을 맞을 거야. 이 파란 액체는 지역 곳곳의 통에 많이 들어 있지만, 정체를 아는 사람은 없어. 알아내려는 사람도 별로 없고. 하지만 우린 기회를 잡아 수익을 낼 거야. 그러려면 재료가 하나 더 필요해. 공장 어딘가에 있을 거야. 쓰레기로 가득 찬 방이 있는데, 거기서 실험실을 운영했대. 밝은 노란색 주사기를 찾아. 펜처럼 생겼고 모르핀 주사기와 비슷해. 무슨 말인지 알겠지.", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "이 퀘스트를 받으려면 예거와 상인 평판 등급 2를 달성해야 합니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "공장에 숨겨진 화학 물질 주사기 획득하기\n화학 물질 주사기를 스키어에게 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+10,000 경험치\n1,000 유로\n정보 센터 1레벨일 때 1,050 유로\n정보 센터 2레벨일 때 1,150 유로\nORSIS T-5000M 7.62×51 볼트액션 저격소총 1정\n7.62×51mm M80 탄약 묶음(20발) 1개\n스키어 상인 평판 등급 2에서 ORSIS T-5000M 7.62×51 볼트액션 저격소총 구매 해금\n\n좋아. 실험이 진행되는 동안은 최대한 멀리 떨어져 있는 게 좋겠어. 나중에 확인해보자고.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "목표 주사기는 공장 사무실 3층의 진입 파괴가 필요한 방 안에서 찾을 수 있습니다. 방 안 여러 곳에 생성됩니다.\n\n지도에 표시된 위치\n주사기가 있는 ‘강제 진입 방’의 문\n들어간 뒤 오른쪽 선반 아래 칸의 주사기\n쌓아 둔 의자 옆 바닥의 주사기\n들어간 뒤 왼쪽에 있는 쓰러진 서류 캐비닛 위의 주사기", translationSource: "English wiki source translation" },
    ],
  }],
  [13584, {
    titleKo: "히포크라테스 선서",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕하세요. 우린 오랫동안 알고 지냈고, 이제 서로 다툴 이유도 없죠. 당신도 저만큼 우리의 협력이 필요하리라 생각합니다. 걱정 마세요. 신뢰를 억지로 요구하진 않겠습니다. 서방 의료 물자를 대량으로 보유한 사람과 접촉했는데, 그 사람이 제게 물건을 팔 의향이 있답니다. 다만 외화로만 받겠다고 하네요. 도와주신다면 다시 친구로 지내는 걸로 하죠.", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "등자(Stirrup) 퀘스트 완료\n자동차 수리(Car Repair) 퀘스트 완료\n테라피스트 평판이 0.6 미만이어야 합니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "테라피스트에게 500달러 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "테라피스트 평판 +0.2\n\n앞으로는 언제든 저를 믿으셔도 됩니다.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "달러는 피스키퍼에게 루블을 주고 구매할 수 있습니다.", translationSource: "English wiki source translation" },
    ],
  }],
  [46439, {
    titleKo: "빛을 향해 - 믿되 확인하라",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "등대에서 요청이 들어왔습니다. 내용이 상당히 특이하더군요. 그가 정확히 무슨 계획을 세우는지는 아직 모르겠지만, 당신이 관심을 보였던 게 생각나 이번 일에 참여시키기로 했습니다. 라이트키퍼와 접촉하고 싶다고 했죠? 그가 수정이 필요한 데이터가 담긴 하드 드라이브를 제게 맡겼습니다. 이 드라이브를 실험 구역에 있는 연구소 서버실 중 한 곳에 두고 와야 합니다. 다만 중요한 조건이 두 가지 있습니다. 첫째, 발견한 사람이 대피 전부터 연구소에 있던 물건이라고 믿도록 드라이브를 위장해야 합니다. 미끼를 준비하느라 평소보다 시간이 더 걸릴 겁니다. 속임수가 들통나면 라이트키퍼와 다시 협력하기 어려워질 수 있습니다. 둘째, 연구소 내부 시스템을 작동시키면 라이트키퍼의 미끼를 물 예정인 집단이 의심할 겁니다. 그러니 환기구처럼 조용히 빠져나갈 방법을 찾아야 합니다.", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "투어 스토리 챕터에서 터미널 상황을 파악한 뒤, 라이트키퍼와 협력할 수 있는지 정비사에게 물어보기\n테라피스트, 스키어, 피스키퍼, 정비사, 레그맨, 예거의 상인 평판 등급 3 달성", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "위조 데이터를 넣은 하드 드라이브를 연구소 무기 시험 구역 인근 서버실에 숨기기(한 번의 레이드에서 완료)\n(선택) 그 후 환기구로 탈출하기\n한 번의 레이드에서 연구소 환기구를 통해 탈출하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+35,000 경험치\n300,000 루블\n정보 센터 1레벨일 때 315,000 루블\n정보 센터 2레벨일 때 345,000 루블\n테라그룹 연구소 출입 카드 2개\n\n드라이브를 충분히 잘 위장했나요? 확실하죠? 좋습니다. 라이트키퍼에게 모든 일이 끝났다고 알리겠습니다. 당신이 없는 동안 이 일에 대해 생각해봤습니다… 라이트키퍼가 적에게 가짜 정보를 흘리려 한다면 이해할 수 있습니다. 하지만 제 생각이 맞다면, 하드 드라이브를 회수하러 자기 사람들을 보낼 겁니다. 그렇다면 우리가 데이터를 바꾸고 드라이브를 위장한 이유가 뭘까요? 왜 자기 자원을 쓰지 않고 우리 같은 외부인을 끌어들였을까요?", translationSource: "English wiki source translation" },
      { title: "Initial Equipment", titleKo: "초기 장비", text: "", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "먼저 레이드 외 퀘스트 인벤토리에 지급된 하드 드라이브를 연구소 1층(O11)의 주요 작업 구역 서버에 숨겨야 합니다. 사망해도 드라이브를 잃지 않습니다. 그다음 같은 레이드에서 ‘환기구’ 탈출 지점을 이용해야 합니다. 배낭을 착용한 상태로는 해당 탈출 지점을 이용할 수 없습니다.\n\n지도에 표시된 은닉 및 탈출 위치\n은닉 장소\n탈출 지점", translationSource: "English wiki source translation" },
    ],
  }],
  [45602, {
    titleKo: "불청객 - 파트 1",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "아, 당신이군. 아직 살아 있어서 다행이야… 누군가 내 부하들을 한 번에 한 분대씩 없애고 있어. 갑자기 자취를 감춘다고. 요구 조건을 내건 것도 아니야! 범인은 반드시 찾아내겠어. 하지만 지금은 급한 일이 있어. 도와줄 수 있나? 가장 급한 건 해안에서 북쪽의 의뢰인에게 보내기로 한 장비야. 부하들이 항구에서 연락책을 만나 물건을 받아 BTR 운전기사에게 넘기기로 했는데, 아무 소식이 없어! 부하들을 찾아봐 줄래? 아니면 적어도 물건이라도 찾아줘. 해안 어딘가에서 습격당했을 테니 그 근처부터 살펴봐.", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "시즌 모드로 플레이 중이어야 합니다.\n프라포르 평판 0.2 이상을 달성해야 합니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "군용 장비가 든 케이스 찾기 및 확보하기\n(선택) 쇼어라인 소르디 타워 옆 오두막 조사하기\n(선택) 쇼어라인 기상 관측소 건물 2층 조사하기\n(선택) 쇼어라인 수력 발전소 조사하기\n군용 장비가 든 케이스를 BTR 운전기사에게 가져가기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+6,000 경험치\n18,000 루블\n정보 센터 1레벨일 때 18,900 루블\n정보 센터 2레벨일 때 20,700 루블\nRPK-16 5.45×39 경기관총 1정\nAK-74 5.45×39 6L23 30발 탄창 3개\n5.45×39mm PP gs 탄약 묶음(120발) 1개\n\n일을 마쳐줘서 고맙네. 의뢰인은 그 장비를 기다리고 있었어. 이제 이 일의 두 번째 단계로 넘어가 내 부하들을 쫓는 놈들이 누군지 알아낼 수 있겠군.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "쇼어라인에서 군용 장비 케이스를 확보해야 합니다.\n\n지도에 표시된 케이스 생성 위치\n케이스는 다음 세 장소 중 한 곳에서 생성됩니다.\n소르디 타워 숙소 안의 케이스\n기상 관측소 2층 서랍장 옆 구석에 있는 케이스\nHEP 변전소 보관실 열쇠가 필요한 문 옆, 수력 발전소 내부의 케이스\n\n케이스를 집으면 퀘스트 아이템 인벤토리에 들어갑니다. 전달하려면 케이스를 가진 채 생존 탈출해야 합니다. BTR 운전기사에게 도착하기 전에 사망하면 다시 찾아야 합니다. 퀘스트를 완료하려면 ‘불청객 - 파트 2’에서 케이스를 BTR 운전기사에게 건네세요.", translationSource: "English wiki source translation" },
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
