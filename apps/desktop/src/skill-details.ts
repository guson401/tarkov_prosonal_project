type SkillLike = { id: string; name: string; category: string };

type SkillDetail = { effect: string; elite: string; train: string; atLevel?: (level: number) => string };

const details: Record<string, SkillDetail> = {
  endurance: { effect: "달리기·점프 스태미나와 숨 참기 능력이 향상됩니다.", atLevel: (level) => { const points = Math.min(level, 50); return `현재 레벨 보너스: 스태미나 +${points}%, 점프 스태미나 소모 -${(points * 0.6).toFixed(1)}%, 숨 참기 +${points * 2}%, 호흡 회복 시간 -${points}%.`; }, elite: "최대 스태미나가 추가로 +20% 증가하고 팔 지구력이 향상됩니다. 에너지와 무관하게 호흡합니다.", train: "과중량 상태가 아닌 상태에서 걷거나 달리기, 사격장 체육관 QTE를 수행합니다." },
  strength: { effect: "점프 높이, 운반 한도, 근접 공격력, 이동·질주 속도, 투척 거리가 향상됩니다.", atLevel: (level) => { const points = Math.min(level, 50); return `현재 레벨 보너스: 점프 높이 +${(points * 0.4).toFixed(1)}%, 운반 한도 +${(points * 0.6).toFixed(1)}%, 이동·질주 속도 +${(points * 0.4).toFixed(1)}%, 투척 거리 +${(points * 0.4).toFixed(1)}%.`; }, elite: "슬링·등 슬롯 무기의 무게가 운반 중량에 반영되지 않으며, 근접 치명타 확률이 증가합니다.", train: "과중량 상태에서 걷거나 달리고, 투척 무기·근접 무기를 사용하거나 체육관 QTE를 수행합니다." },
  health: { effect: "탈수 속도를 낮춥니다. 지구력·근력·활력 스킬 경험치의 일부가 건강에 함께 반영됩니다.", atLevel: (level) => `탈수 속도 감소: ${(Math.min(level, 50) * 0.6).toFixed(1)}%. Endurance, Strength, Vitality 스킬 경험치의 25%가 Health에도 반영됩니다.`, elite: "피해 흡수 효과를 얻습니다. 세부 수치는 게임 업데이트에 따라 달라질 수 있습니다.", train: "지구력, 근력, 활력 경험치를 얻고 관련 퀘스트 보상을 받습니다." },
  immunity: { effect: "식량·수분·주사제의 부정 효과와 중독 영향이 감소하고 진통제 지속 시간이 늘어납니다.", elite: "식량·수분·주사제 부작용 및 중독에 면역이 될 확률이 증가합니다.", train: "레이드에서 부정 효과를 유발하는 식량·수분·주사제를 사용하고 효과가 끝날 때까지 생존합니다." },
  metabolism: { effect: "식량과 음료의 긍정 효과가 증가하고 부정 효과 지속 시간이 감소합니다.", elite: "기력 고갈과 탈수로 피해를 받지 않습니다.", train: "레이드 중 식량과 음료를 섭취해 기력과 수분을 회복합니다." },
  vitality: { effect: "출혈 발생 가능성을 줄이고 부상에 대한 생존 능력을 높입니다.", elite: "출혈 및 부상 관련 생존 보너스가 강화됩니다.", train: "레이드 중 피해를 받고 출혈·부상 상태를 치료하며 관련 퀘스트를 완료합니다." },
  stress_resistance: { effect: "통증 상태와 스트레스 상황에 대한 저항력이 향상됩니다.", elite: "스트레스 저항 효과가 크게 강화됩니다.", train: "레이드 중 부상·통증 등 스트레스 상황을 겪고 생존합니다." },
  attention: { effect: "전리품 탐색 및 발견 능력이 향상됩니다.", elite: "주변 전리품 탐색 능력이 크게 강화됩니다.", train: "레이드에서 컨테이너와 시체를 탐색합니다." },
  perception: { effect: "주변 상황 인지와 청각 탐지 능력이 향상됩니다.", elite: "청각 탐지 능력이 추가로 강화됩니다.", train: "레이드에서 주변을 살피고 전리품·컨테이너를 탐색합니다." },
  charisma: { effect: "상인과의 상호작용 및 일부 진행 보너스가 향상됩니다.", elite: "카리스마 관련 보너스가 강화됩니다.", train: "레이드에서 아이템을 발견·수집하고 상인 퀘스트를 완료합니다." },
  intellect: { effect: "아이템 조사와 수리·제작 관련 효율이 향상됩니다.", elite: "지능 관련 효율 보너스가 강화됩니다.", train: "아이템을 조사하고, 수리·제작·치료 등 관련 행동을 수행합니다." },
  crafting: { effect: "은신처 제작 효율과 제작 경험이 향상됩니다.", elite: "제작 관련 효율 보너스가 강화됩니다.", train: "은신처에서 아이템을 제작합니다." },
  hideout_management: { effect: "은신처 모듈의 보너스와 운영 효율이 향상됩니다.", elite: "은신처 관리 보너스가 강화됩니다.", train: "은신처 모듈을 사용하고 제작·생산을 수행합니다." },
  search: { effect: "컨테이너와 시체를 탐색하는 속도와 효율이 향상됩니다.", elite: "탐색 관련 효율이 강화됩니다.", train: "레이드에서 컨테이너와 시체를 직접 탐색합니다." },
  surgery: { effect: "수술 키트 사용 속도와 수술 후 상태가 향상됩니다.", elite: "수술 후 체력 페널티가 제거됩니다.", train: "레이드에서 수술 키트로 손상된 신체 부위를 치료합니다." },
  weapon_maintenance: { effect: "무기 내구도 관리와 무기 수리 효율이 향상됩니다.", elite: "무기 수리 관련 보너스가 강화됩니다.", train: "레이드에서 무기를 사용하고 은신처 또는 상인에서 무기를 수리합니다." },
};

const categoryDetails: Record<string, SkillDetail> = {
  Physical: { effect: "해당 신체 스킬의 능력치가 레벨에 따라 향상됩니다.", elite: "레벨 51에서 이 스킬 고유의 마스터 보너스가 적용됩니다.", train: "레이드에서 해당 스킬과 연결된 신체 행동을 수행합니다." },
  Combat: { effect: "해당 무기 유형의 조작·반동·숙련 효율이 레벨에 따라 향상됩니다.", elite: "레벨 51에서 해당 전투 스킬의 고유 마스터 보너스가 적용됩니다.", train: "레이드에서 해당 스킬에 해당하는 무기를 사용해 적을 공격합니다." },
  Practical: { effect: "해당 실용 행동의 속도와 효율이 레벨에 따라 향상됩니다.", elite: "레벨 51에서 해당 실용 스킬의 고유 마스터 보너스가 적용됩니다.", train: "레이드 또는 은신처에서 해당 스킬과 연결된 행동을 반복합니다." },
  Mental: { effect: "해당 정신 스킬의 탐지·상호작용 능력이 레벨에 따라 향상됩니다.", elite: "레벨 51에서 해당 정신 스킬의 고유 마스터 보너스가 적용됩니다.", train: "레이드에서 탐색·발견·상호작용 등 관련 행동을 수행합니다." },
  Other: { effect: "이 항목은 인게임 활성 스킬이 아닌 보조 API 데이터입니다. 레벨 효과가 확인되지 않았습니다.", elite: "인게임 마스터 효과가 확인되지 않았습니다.", train: "게임 내 획득 방법이 확인되지 않았습니다." },
};

export function skillIconPath(skill: SkillLike) {
  return `/images/skills/${skill.id.replaceAll("_", "-")}.webp`;
}

export function getSkillDetails(skill: SkillLike) {
  return details[skill.id] ?? categoryDetails[skill.category] ?? categoryDetails.Other;
}

export function skillWikiUrl(skill: SkillLike) {
  const slug = skill.name.replaceAll(" ", "_").replaceAll("'", "%27");
  return `https://escapefromtarkov.fandom.com/wiki/${encodeURIComponent(slug).replaceAll("%2F", "/")}`;
}
