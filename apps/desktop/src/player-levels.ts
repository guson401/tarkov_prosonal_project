export const playerLevelExperience = [
  0, 1_000, 3_017, 4_415, 5_824, 7_221, 8_546, 9_913, 11_268, 12_519,
  13_840, 15_716, 22_023, 27_951, 34_084, 40_548, 46_547, 52_419, 57_549, 63_065,
  67_696, 72_817, 78_369, 84_803, 94_916, 108_067, 122_126, 133_164, 144_320, 155_595,
  166_982, 180_344, 196_685, 215_087, 233_690, 258_091, 281_805, 305_744, 326_065, 346_570,
  367_261, 388_137, 416_600, 445_333, 474_331, 528_224, 559_155, 590_350, 621_815, 653_537,
  685_522, 717_765, 761_235, 805_078, 849_297, 893_877, 938_823, 984_131, 1_029_795, 1_095_775,
  1_225_050, 1_319_453, 1_431_321, 1_558_177, 1_748_019, 2_002_313, 2_480_456, 3_447_343, 4_924_970, 6_306_999,
  7_640_970, 8_986_198, 10_341_135, 11_704_613, 13_075_721, 14_453_730, 15_838_039, 18_623_623, 27_091_684,
] as const;

export const MAX_PLAYER_LEVEL = playerLevelExperience.length;
export const MAX_PLAYER_EXPERIENCE = playerLevelExperience.at(-1)!;

export function experienceRequiredForLevel(level: number) {
  return playerLevelExperience[Math.min(MAX_PLAYER_LEVEL, Math.max(1, Math.floor(level))) - 1];
}

export function playerLevelForExperience(experience: number) {
  const total = Math.max(0, experience);
  for (let index = playerLevelExperience.length - 1; index >= 0; index--) {
    if (total >= playerLevelExperience[index]) return index + 1;
  }
  return 1;
}

export function getPlayerExperienceProgress(experience: number) {
  const level = playerLevelForExperience(experience);
  const currentLevelExperience = experienceRequiredForLevel(level);
  const nextLevelExperience = level < MAX_PLAYER_LEVEL ? experienceRequiredForLevel(level + 1) : currentLevelExperience;
  const levelRange = nextLevelExperience - currentLevelExperience;
  const progress = levelRange > 0 ? Math.min(1, Math.max(0, (experience - currentLevelExperience) / levelRange)) : 1;
  return {
    level,
    currentLevelExperience,
    nextLevelExperience,
    experienceIntoLevel: Math.max(0, experience - currentLevelExperience),
    experienceToNextLevel: Math.max(0, nextLevelExperience - experience),
    progress,
  };
}
