import { readFile, writeFile } from "node:fs/promises";

const file = "resources/quests/quests.en.json";
const data = JSON.parse(await readFile(file, "utf8"));
const translations = new Map([
  [46528, {
    titleKo: "선택받은 자들의 영광을 위하여",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "전체적인 그림을 보고 싶어 하면서도, 당신이 아직 도구에 불과하다는 사실은 잊고 있군. 더 알고 싶다면 지금까지 익숙했던 분쟁의 편에서 벗어나 상황을 내려다봐야 해. 정말 준비됐나? 그렇다면 다음 임무를 잘 들어. 지시를 정확히 따라야 한다. 먼저 울트라 주차장의 14번 컨테이너에서 물건을 회수해. 발전소에서 전력을 복구한 다음 버거 스폿으로 올라가 화장실에 숨겨진 패널을 찾아. 패널에 #11SR 카드키를 사용하고, 주차장에 있는 테라그룹 안전실로 내려가. OLI에서 내려오는 에스컬레이터와 주차장 벽의 파손된 틈 옆에 있어. 안에 있는 레버를 당기면 14번 컨테이너가 열린다. 컨테이너는 IDEA 아래 주차장, 발전소 방향 출구 근처에 있어. 테라그룹 표시가 있는 초록색 컨테이너를 찾아. 여행 가방을 회수하면 시내로 이동해. 파인우드 호텔 3층 식당으로 가서 발코니에 가방을 두고 와. 그다음 지하로 무너져 내린 트램 근처에서 노란 신호탄을 쏴. 목격자는 없어야 한다는 것도 잊지 마. 야간에 작전을 수행하고, 널 봤을 만한 사람은 모두 제거해. 모든 일이 끝나면 내게 돌아와.", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "시즌 모드로 플레이 중이어야 합니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "라이트키퍼에게 보고하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+30,000 경험치\n\n안에 뭐가 들었는지 말했더라면 이 일을 맡지 않았겠지. 하지만 걱정하지 마. 바이러스도 방사능도 없어. 네 말이 맞았어. 블랙 디비전의 임무는 시설을 정리하는 데서 끝나지 않아. 테라그룹의 가장 가까운 경쟁자들이 확보하려면 적어도 10년은 걸릴 샘플이 타르코프에 아직 남아 있지. 그게 무엇이고 어떤 용도인지는 말해주지 않겠다. 어떤 것들은 도시 전체와 그 안에 사는 사람 모두보다 가치가 있으니까. 사람들이 죽더라도 그 선물은 새로운 세상까지 살아남아야 해. 블랙 디비전이 타르코프에서 작전을 마치고 나면 계획을 가로막을 것은 아무것도 남지 않을 거야.", translationSource: "English wiki source translation" },
    ],
  }],
  [10263, {
    titleKo: "큰 손실",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "형제, 잘 지냈어? 최근 울트라 화물 기록을 살펴보다가 운송 중 큰 화물이 사라진 걸 발견했어. 운송장에는 배터리가 실려 있었다고 하더군. 무슨 말인지 알겠지? 지금 우리 상황에 꽤 쓸모 있는 물건이야. 이런 일은 보통 물류 부서에서 처리해. 사무실에 가서 운송 경로와 현재 상태를 좀 알아봐 줄 수 있어? 이 은혜는 잊지 않을게! 사무실은 아마 잠겨 있을 거야. 열쇠가 어디로 갔는지는 모르겠지만, 넌 똑똑하잖아. 잘 해낼 거라 믿어.", translationSource: "English wiki source translation" },
      { title: "Requirements", titleKo: "요구 조건", text: "USEC PMC로만 수락할 수 있습니다.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "인터체인지에서 OLI 화물 운송 경로 서류 찾기 및 확보하기\n서류를 레그맨에게 전달하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+3,000 경험치\n레그맨 평판 +0.1\n80,000 루블\n정보 센터 1레벨일 때 84,000 루블\n정보 센터 2레벨일 때 92,000 루블\n\n알겠지? 좋아. 이제 그 트럭이 어디로 사라졌는지 알아보자고.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "이 퀘스트에서는 인터체인지 울트라 쇼핑몰 1층에 있는 OLI 물류 부서 사무실에서 OLI 화물 운송 경로 서류를 확보해야 합니다. 사무실에 들어가려면 OLI 물류 부서 사무실 열쇠가 필요합니다.\n\n지도에 표시된 사무실 위치\nOLI 사무 구역 입구\n목표 사무실 문\n왼쪽 선반 위의 서류", translationSource: "English wiki source translation" },
      { title: "See also", titleKo: "관련 문서", text: "Inventory Files - BEAR 진영 대응 퀘스트", translationSource: "English wiki source translation" },
    ],
  }],
  [44498, {
    titleKo: "씁쓸한 승리",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "그래, 밀수꾼들이 손실을 감수하긴 했지만 지휘관을 빼내는 데 성공했어. 가서 상황을 정리하고 네 얘기도 물어볼 생각이야. 지금 그 사람들은 승리를 축하하는 한편, 잃은 동료들을 제대로 추모해야 해. 그러니 빈손으로 갈 수는 없지. 상 차리는 걸 도와줄래?", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "피어스 해츨링 문샤인 2병을 BTR 운전기사에게 건네기\n(선택) 피어스 해츨링 문샤인 2병 획득하기\n라이 크루통 4개를 BTR 운전기사에게 건네기\n(선택) 라이 크루통 4개 획득하기\n타르코프스카야 보드카 4병을 BTR 운전기사에게 건네기\n(선택) 타르코프스카야 보드카 4병 획득하기\n솔티 독 비프 소시지 2개를 BTR 운전기사에게 건네기\n(선택) 솔티 독 비프 소시지 2개 획득하기\nBTR 운전기사와 대화하기\n지역에서 생존 후 탈출하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+30,000 경험치\n\n꽤 괜찮은 식량을 가져왔군. 이 정도면 대화가 한결 수월해지겠어. 다음에 만날 때쯤이면 네 부탁과 관련해 뭔가 알아냈을 거야.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "물품을 하나라도 건네기 전에 필요한 물품을 모두 모아 인벤토리에 가지고 있어야 합니다. 퀘스트를 수락하기 전에 얻은 물품을 건네려면 다른 인벤토리 칸으로 옮겨야 게임에서 정상적으로 인식합니다.", translationSource: "English wiki source translation" },
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
