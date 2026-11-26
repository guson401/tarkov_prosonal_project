import { readFile, writeFile } from "node:fs/promises";

const file = "resources/quests/quests.en.json";
const data = JSON.parse(await readFile(file, "utf8"));
const translations = new Map([
  [19166, {
    titleKo: "어려운 선택",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "젊은이, 잠깐. 예거가 위생병을 죽이라고 할 줄 알았어. 하지만 꼭 그럴 필요는 없어. 위생병을 괴물 같은 인간이라고 보는 예거의 입장은 이해해. 하지만 그는 그런 사람이 아니야. 분명 지역 주민을 도우려는 것뿐일 거야. 지금 같은 상황에서 그는 가장 복잡한 수술을 집도하고 있고, 수술이 잘못되는 경우가 많은 것도 놀랄 일은 아니지. 많은 생명을 구할 수 있는 귀중한 지식을 가진 의사야. 우리에게 절실한 의약품 창고에 접근할 수 있는 의사이기도 하고. 이미 나와 협상을 시작했으며 곧 협력할 거야. 그러려면 그의 관심을 끌 만한 것이 필요한데, 뭔지 알 것 같아. 연구소 말이야. 출입 카드와 군용 자극제가 그가 실험하는 데 필요한 재료인 것 같아. 찾아다 줄 수 있겠어? 출입 카드는 어떤 방법으로든 구해도 되지만, 자극제는 밀봉된 채로 발견해야 하니 직접 찾아야 해.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "위생병을 처치하지 않기\n레이드에서 테라그룹 연구소 출입 카드 10개 찾기\n출입 카드 건네기\n레이드에서 AHF1-M 자극제 주사기 찾기\n주사기 건네기\n레이드에서 3-(b-TG) 자극제 주사기 찾기\n주사기 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+65,000 경험치\nTHICC 아이템 케이스 1개\n\n고맙다. 지금 위생병과 그의… 약이 얼마나 중요한지 네가 이해해줄 줄 알았어. 그는 출입 카드와 자극제에 큰 관심을 보였고, 이미 첫 물량을 보냈어. 여기, 네 몫이야.", translationSource: "English wiki source translation" },
      { title: "Failure Penalty", titleKo: "실패 시 불이익", text: "이성의 목소리 대신 예거의 말을 들었다니 안타깝군. 위생병은 지식과 의약품으로 우리에게 많은 도움을 줄 수 있었어. 성자는 아니지만 누구든 죄를 씻을 기회는 있는 법인데, 네가 그 기회를 빼앗았어. 정말 실망스럽군.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "‘사냥꾼의 길 - 새디스트’를 완료하면 실패 처리되어 이 퀘스트를 더는 진행할 수 없습니다.", translationSource: "English wiki source translation" },
    ],
  }],
  [46481, {
    titleKo: "낯익은 얼굴...",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "그래, 친구! 밀수꾼들이 수처리 시설 기지에서 로그들을 몰아냈다는 소식 들었어? 내 생각엔 꽤 좆같은 상황이야. 피스키퍼와 그 일로 틀어진 뒤로 저 얼간이들과 계속 대립해왔는데, 놈들이 더 강해지는 꼴은 보고 싶지 않아. 이번 승리만 봐도 얼마나 위험한지 알겠지… 아직 어떻게 제대로 압박해야 할지는 모르겠어. 그래도 정보는 모아야 해. 그들과 친해져서 기차역에서 무슨 일이 있었는지 알아봐 줄 수 있겠어? 수처리 시설을 공격할 때 출발했던 곳 말이야. 거창한 일은 필요 없어! 기본 장비만 걸치고 놈들을 살펴봐.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "키라사-N 또는 NFM THOR CRV 방탄복을 착용하고 라이트하우스에서 장갑 열차를 이용해 탈출하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+15,000 경험치\n1,800 유로\n정보 센터 1레벨일 때 1,890 유로\n정보 센터 2레벨일 때 2,070 유로\nCENS ProFlex DX5 전술 이어플러그 2개\n\n네가 가져온 정보로 보면 밀수꾼들은 로그들과 싸우면서 자기들도 상당한 손해를 봤어. 그나마 다행이군. 그래도 경계를 늦춰선 안 돼. 놈들은 분명 그곳에 자리를 잡으려 할 테니 계속 감시해야 해.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "", translationSource: "English wiki source translation" },
    ],
  }],
  [21248, {
    titleKo: "연료 문제",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕! 예비 기지에서 연료를 찾으려고 부하들을 모으는 중이야. 고정식 연료 탱크와 탱크 차량이 있다는데 정확히 어디 있는지 모르겠어. 저격수에게 총 맞아가며 찾게 할 수는 없잖아. 네가 직접 가서 연료 탱크에 표식을 붙여주면 어때? 큰 연료 탱크 무리를 찾아봐.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "리저브에서 첫 번째 연료 탱크 무리에 MS2000 마커 설치하기\n리저브에서 두 번째 연료 탱크 무리에 MS2000 마커 설치하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+28,000 경험치\n레그맨 평판 +0.75\n275,000 루블\n정보 센터 1레벨일 때 288,750 루블\n정보 센터 2레벨일 때 316,250 루블\n\n정말 고마워. 이제 위치를 알았으니 위험을 감수하지 않아도 되겠군. 일을 잘 마친 보상이야, 형제.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "리저브에서 연료 탱크 무리 2곳을 찾아 마커를 설치해야 합니다.\n\n지도에 표시된 연료 탱크 위치\n하수구 맨홀 탈출 지점 옆 첫 번째 탱크 무리\n열차 정비소 옆 두 번째 탱크 무리", translationSource: "English wiki source translation" },
      { title: "Trivia", titleKo: "참고", text: "필요하다면 프라포르나 레그맨에게 MS2000 마커를 구매할 수 있습니다.\nMS2000 마커를 잃지 않도록 특수 슬롯이나 파우치에 보관하는 것을 권장합니다.\n열쇠와 마찬가지로, 필요할 때 인벤토리 안의 MS2000 마커가 자동으로 사용됩니다.", translationSource: "English wiki source translation" },
    ],
  }],
  [34618, {
    titleKo: "건강한 대안",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕하세요. 폴리켐 공장의 실험실 일지를 찾으라는 의뢰를 받으셨다고 들었습니다. 테라그룹은 서류를 회수해주면 후하게 보상할 모양이더군요. 다시 생각해보시길 권합니다. 회사가 그 자료를 그토록 원한다면 뭔가 가치 있는 것을 숨기고 있는 게 분명합니다! 물론 도시와 시민들에게 가치 있는 것을 말하는 겁니다. 그 일지를 제게 맡겨주세요.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "실험실 일지 건네기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+3,000 경험치\n럭키 스캐브 정크박스 1개\n\n올바른 편을 선택하셨군요! 이 일지는 제 지인의 실험에 아주 유용할 겁니다… 연구라고 해야겠네요! 아직 도시에 남아 있는 타르코프 시민들의 고통을 덜어줄 수 있을 겁니다.", translationSource: "English wiki source translation" },
      { title: "Failure Dialogue", titleKo: "실패 대사", text: "일지를 회사에 돌려주기로 했나요? 이 마을 사람들에게는 별 관심이 없어 보이는군요. 그런 선택을 하시다니 실망입니다.", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "‘남은 흔적 하나’를 완료하면 이 퀘스트를 더는 진행할 수 없습니다.\n\n일지는 공장 2층 실험실에서 찾을 수 있으며, 두 방 곳곳에 여러 생성 위치가 있습니다.\n\n지도에 표시된 실험실 위치\n실험실 입구\n생성 위치 1: 첫 번째 방의 손수레 위\n생성 위치 2: 첫 번째 방, 유리 진열장 옆 서랍장 위\n생성 위치 3: 두 번째 방, 오른쪽 산업용 선반 아래 칸\n생성 위치 4: 두 번째 방 바닥의 작은 냉장고 안\n생성 위치 5: 두 번째 방 오른쪽 책상 위", translationSource: "English wiki source translation" },
    ],
  }],
  [37667, {
    titleKo: "도움의 손길",
    sectionsKo: [
      { title: "Dialogue", titleKo: "대화", text: "안녕하세요. 타르코프를 돌아다니는 BTR은 이미 보셨겠죠. 운전기사는 원래 당신 같은 PMC에게 서비스를 제공했지만, 최근에는 스키어와도 일하기 시작했습니다. BTR을 복구하던 때 운전기사가 제게 찾아왔죠. 꽤 흥미로운 작업이었습니다. 물론 그 얘기를 하려던 건 아닙니다. 한동안 연락이 없더니 갑자기 도움을 요청했습니다. 심각한 일이 생긴 모양이에요. 찾아가서 무슨 일인지 알아봐 주시겠어요? 타르코프에는 재치와 야망을 갖춘 사람이 얼마 남지 않았습니다. 우리 같은 사람끼리 뭉쳐야죠.", translationSource: "English wiki source translation" },
      { title: "Objectives", titleKo: "목표", text: "우즈에서 프라포르의 화물 찾기 및 확보하기\n지역에서 생존 후 탈출하기\n‘배송 지연 - 파트 1’ 퀘스트 완료하기", translationSource: "English wiki source translation" },
      { title: "Rewards", titleKo: "보상", text: "+10,000 경험치\n165,000 루블\n정보 센터 1레벨일 때 173,250 루블\n정보 센터 2레벨일 때 189,750 루블\n‘더 아이’ 박격포 공격 신호 장치 1개\n\n스키어 패거리에 들어가는 건 위험하다고 말했는데… 물론 이점도 있겠지만, 그렇게 큰 사업에 들어가면 독립성을 유지하기 어렵지. 누가 스키어를 배신했을까? BTR은 그의 보호를 받고 있어야 할 텐데…", translationSource: "English wiki source translation" },
      { title: "Guide", titleKo: "공략", text: "우즈에서 프라포르의 화물을 찾아야 합니다. 화물은 열차 정비소 북서쪽 건물 안의 두 장소 중 한 곳에 생성됩니다. 정비소에는 BTR 운전기사의 택시 서비스를 이용해야 들어갈 수 있습니다. 화물을 회수한 뒤 프라포르의 ‘배송 지연 - 파트 1’ 퀘스트에서 건네면 이 퀘스트를 완료할 수 있습니다.\n\n지도에 표시된 건물\n목표 건물\n생성 위치 1: 침대 옆 탁자 아래\n생성 위치 2: 안쪽 사무실 책상 위\n\n서쪽 열차 위를 걸어서 정비소를 빠져나갈 수도 있습니다. 저격수나 지뢰에 맞지 않도록 열차 위를 걸을 때는 중앙을 따라가세요.\n\n열차로 가는 길\n열차", translationSource: "English wiki source translation" },
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
