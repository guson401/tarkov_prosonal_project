import { readFile, writeFile } from "node:fs/promises";

const file = "resources/quests/quests.en.json";
const data = JSON.parse(await readFile(file, "utf8"));
const translations = new Map([
  [47511, {
    titleKo: "어려운 곳의 간단한 임무",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "레프의 사람들이 연구소로 향했다는 사실이 이제 확실해졌습니다. 레프가 검투사들에게 시중에서 구할 수 없는 자극제를 빼돌리려는 걸 수도 있고, 관중석의 사람들에게 팔려는 것일 수도 있겠죠… 시간을 낭비할 수 없습니다. 그 시설이 얼마나 위험한지 잘 아시니, 당신 말고는 보낼 사람이 없습니다. 주변을 정찰하고 보고해 주세요. 무엇보다 미루지 말고 각별히 조심하세요.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "연구소에서 생존 후 탈출하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+18,000 경험치\n체력 스킬 레벨 +1\n350,000 루블\n정보 센터 1레벨일 때 367,500 루블\n정보 센터 2레벨일 때 402,500 루블\n자구스틴 지혈제 주사기 3개\n프로피탈 재생 자극제 주사기 3개\n골든 스타 밤 2개\n\n무사히 다녀와서 다행입니다. 레프의 사람들이 아직 시설에 있다면 테라그룹의 개발품 중 특정한 것을 찾고 있거나 재판매할 귀중한 자재를 최대한 많이 챙기려는 거겠죠. 이 상황을 이용할 기회가 아직 있을지도 모릅니다.", translationSource: "English wiki source translation" },
      { title: "Initial Equipment", titleKo: "초기 장비", text: "", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "‘생존’ 상태로 연구소에서 탈출해야 합니다. ‘런 스루’ 상태로 탈출하면 퀘스트가 완료되지 않습니다. 런 스루 판정을 피하려면 레이드에서 적 처치나 아이템 획득으로 경험치를 200 이상 얻거나, 탈출 전에 레이드에서 7분 이상 머무르세요.", translationSource: "English wiki source translation" },
    ],
  }],
  [41750, {
    titleKo: "작은 축하",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕, 형제! 프라포르와 스키어 사이에 무슨 일이 있었는지 들려줘. 둘이 엄청난 소동을 벌였더군. 기지에서 얌전히 새해를 맞았으면 평범한 사람들처럼 지낼 수도 있었을 텐데… 자네도 거기에 휘말린 모양이야. 그래도 무사히 빠져나와서 다행이지. 조언 하나 해줄까, 아흐페르? 타르코프에서는 오늘이 마지막 날일 수도 있어. 그런데도 자넨 아직 여기서 숨 쉬고 있잖아. 그러니 적어도 하루는 쉬어. 자신에게 휴식을 줘. 새해를 제대로 맞이해야지. 불꽃놀이가 어디 남아 있을 텐데… 여기, 가져가! 괜찮은 장소를 찾아봐. 야외에 장식된 트리가 남아 있으면 좋겠군. 딱이야! 불꽃놀이를 하고, 올리비에 샐러드를 먹고, 보드카도 한잔해. 새해에는 모든 일이 나아지기를 바라며 건배하자고.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "지정된 장소에서 불꽃놀이 쏘기\n올리비에 샐러드 먹기\n보드카 마시기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+20,000 경험치\n레그맨 평판 +0.01\n80,000 루블\n정보 센터 1레벨일 때 84,000 루블\n정보 센터 2레벨일 때 92,000 루블\nCrye Precision AVS 플레이트 캐리어(레인저 그린) 2개\n탄도 플레이트 케이스 1개\n‘화이트아웃’ 업적 해금\n\n기분이 좀 나아졌어? 내 말이 맞지, 아흐페르! 더 기분 좋게 해줄 선물도 준비했어. 내 특별한 수집품 중 하나라고 생각해. 오해는 하지 마. 이걸로 프라포르 편을 드는 건 아니야. 오래된 물건이고 한동안 내가 손보고 있었어.", translationSource: "English wiki source translation" },
      { title: "Initial Equipment", titleKo: "초기 장비", text: "", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "레이드 중 올리비에 샐러드 상자를 먹고 타르코프스카야 보드카 한 병을 마신 뒤, 크리스마스트리 근처에서 불꽃 신호탄을 쏴야 합니다. 신호탄이 일정 높이까지 올라가지 않으면 목표가 완료되지 않습니다. 위쪽으로 조준하되 너무 높이면 뒤에 떨어질 수 있으니 주의하세요.\n\n크리스마스트리 위치:\n커스텀 - 기숙사 안뜰\n인터체인지 - 고속도로\n라이트하우스 - 침몰한 건물 옆\n리저브 - 수리 센터(화이트 나이트) 서쪽\n쇼어라인 - 헬스 리조트 관리동 앞\n우즈 - 스캐브 기지/에머컴 캠프 근처, 큰 호수의 부유식 컨테이너 부두", translationSource: "English wiki source translation" },
    ],
  }],
  [44650, {
    titleKo: "우리 사이의 쐐기",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "앉아, 꼬마야. 할 얘기가 있어. 파르티잔이 만 위쪽에서 표식 없는 헬리콥터를 봤대. 저 멀리 있는 배를 향해 곧장 날아갔고, 도시로 향하는 건 아니었다더군. 전투용 헬기였고 UN타르 병력이나 PMC 소속은 확실히 아니었어. 그런 걸 타르코프가 아닌 다른 곳에서 딱 한 번 본 적이 있다고 하더군. 특수 부대라면 좋은 일은 없을 거야. 정예 부대 출신 베테랑들을 모으는 중일 가능성이 커. SAS나 모사드일 수도 있고, 요즘은 또 누가 있는지 모르겠군. 정비사에게 아는 게 있는지 물어봤어. 그가 해당 주파수 대역을 듣고 있었는데, 간신히 지휘관의 콜사인을 알아냈대. ‘웨지’… 저런 자들이 배에, 더구나 도시에 자리 잡게 둘 순 없어. 네게 맡기겠다. 불에는 불로 맞서야지.", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "보레아스 스토리 챕터에서 아이스브레이커 C-1 구획의 하드 드라이브를 찾아 정비사에게 건네야 합니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "웨지 분대원 4명 찾아 무력화하기\n웨지에게서 전리품 챙기기\n획득한 물품 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+52,000 경험치\n450,000 루블\n정보 센터 1레벨일 때 472,500 루블\n정보 센터 2레벨일 때 517,500 루블\nAccuracy International AXMC .338 LM 볼트액션 저격소총 1정\n.338 라푸아 매그넘 FMJ 탄약 묶음(20발) 3개\nAI AXMC .338 LM 10발 탄창 3개\n\n내 직감을 믿길 잘했어. 저런 전투원들이 타르코프에 발붙이지 못하게 해야 해. 놈들이 거점을 확보하면 도시 전체를 장악할 테고, 그 뒤엔 아무도 막을 수 없어. 검은 옷을 입은 병사들을 다시 보면 놓치지 마. 우리 생존이 달린 문제일 수도 있어.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "", translationSource: "English wiki source translation" },
    ],
  }],
  [36643, {
    titleKo: "버려진 화물",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕하세요. 최근 수상한 테라그룹 화물에 대한 정보를 입수했습니다. 설명을 보면 중요한 기록, 어쩌면 생물학적 샘플까지 들어 있을 수 있습니다.\n\n이런 화물은 최우선으로 대피시켰어야 하는데, 어떤 이유에선지 세관 터미널 근처에 남겨졌습니다. 안에 무엇이 들었는지 알아내야 하지만 우선 화물부터 찾아야 합니다.\n\n도와주시겠습니까? 테라그룹 로고가 있는 상자를 보면 해당 화물을 알아볼 수 있을 겁니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "커스텀에서 특수 테라그룹 화물 상자 아무 곳에나 MS2000 마커 설치하기\n(선택) 커스텀에서 첫 번째 특수 테라그룹 화물 찾기\n(선택) 커스텀에서 두 번째 특수 테라그룹 화물 찾기\n(선택) 커스텀에서 세 번째 특수 테라그룹 화물 찾기\n(선택) 커스텀에서 네 번째 특수 테라그룹 화물 찾기\n(선택) 커스텀에서 다섯 번째 특수 테라그룹 화물 찾기\n(선택) 커스텀에서 여섯 번째 특수 테라그룹 화물 찾기\n(선택) 커스텀에서 일곱 번째 특수 테라그룹 화물 찾기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+3,000 경험치\n테라피스트 평판 +0.1\n80,000 루블\n정보 센터 1레벨일 때 84,000 루블\n정보 센터 2레벨일 때 92,000 루블\n\n훌륭합니다! 컨테이너를 열지는 않으셨죠? 좋아요. 전문 지식을 갖춘 사람들이 조사하는 편이 낫습니다.", translationSource: "English wiki source translation" },
      { title: "Initial Equipment", titleKo: "초기 장비", text: "", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "커스텀의 화물 적재 구역 7곳 중 한 곳에 MS2000 마커를 설치해야 합니다.\n\n세관 통제 창고(빨간색) - 화물 1개\n지도에 표시된 화물 위치\n창고 서쪽의 화물\n\n17번 창고 - 화물 3개\n지도에 표시된 17번 창고 위치\n17번 창고 남쪽 입구\n1층의 화물\n2층 계단 벽화 뒤의 화물\n3층 크레인 위의 화물\n\n보일러 건물 - 화물 3개\n지도에 표시된 보일러 건물 위치\n보일러 건물\n건물 북쪽 바깥의 화물\n샤워실 옆 화물\n굴뚝 옆의 화물(통)", translationSource: "English wiki source translation" },
      { title: "Trivia", titleKo: "참고", text: "필요하면 프라포르나 레그맨에게 추가 MS2000 마커를 구매할 수 있습니다.\n마커를 잃지 않도록 특수 슬롯이나 파우치에 보관하는 것을 권장합니다.\n열쇠와 마찬가지로, 필요할 때 인벤토리 안의 MS2000 마커가 자동으로 사용됩니다.", translationSource: "English wiki source translation" },
    ],
  }],
  [43283, {
    titleKo: "물품 인수",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "편지에 따르면 에드워드가 지역 밀수꾼들에게 새로운 물품을 공급하거나 할인된 가격에 무언가를 팔고 있다고 합니다. 어느 쪽이든 정확히 무엇을 운반하는지 알아내야 합니다. 정기 항로를 지나는 비행기를 가로채는 건 너무 위험하지만, 편지에는 항공기를 호출할 다른 방법이 적혀 있습니다. 적색 신호탄을 쏴서 비행기에 신호를 보내세요. 편지에 투하 지점은 나와 있지 않지만, 현장에 도착하면 찾을 수 있을 겁니다. 밀수꾼들이 도착하기 전에 화물을 확보하는 게 중요합니다. 밀봉된 소포처럼 보이는 건 무엇이든 가져오세요. 그리고 한 가지 더. 밀수꾼들은 대형 화물을 작은 잠금 컨테이너로 나누는, 스키어와 제가 고안한 예전 방식을 마음에 들어 한 것 같더군요. 그러니 그들의 열쇠도 도움이 될 수 있습니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "잠긴 밀수꾼 케이스 확보해 건네기\n잠긴 케이스 열쇠 확보해 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+11,500 경험치\n1,100달러\n정보 센터 1레벨일 때 1,155달러\n정보 센터 2레벨일 때 1,265달러\n인텔리전스 폴더 3개\n\n에드워드가 내 뒤에서 타르코프에 몰래 들여오려던 게 뭔지 보자고… 열화상 장비 같은데, 이건 일부에 불과해. 화물뿐 아니라 개별 물품도 나눠서 운반했을 거야. 무엇을 얼마나 들여오는지 알아내기 어렵게 하려는 거겠지.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "잠긴 케이스와 케이스 열쇠를 찾아 피스키퍼에게 둘 다 건네야 합니다.", translationSource: "English wiki source translation" },
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
