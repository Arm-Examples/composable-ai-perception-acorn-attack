const INITIAL_SECOND_ACORN_CHANCE = 0.05;
const FINAL_THIRD_ACORN_CHANCE = 0.98;
const FINAL_FOURTH_ACORN_CHANCE = 0.9;

export function spawnCountForDifficulty(
  difficulty: number,
  randomValue: number,
): number {
  const progress = Math.min(Math.max(difficulty, 0), 1);
  const secondAcornChance =
    INITIAL_SECOND_ACORN_CHANCE + (1 - INITIAL_SECOND_ACORN_CHANCE) * progress;
  const thirdAcornChance = FINAL_THIRD_ACORN_CHANCE * progress;
  const fourthAcornChance = FINAL_FOURTH_ACORN_CHANCE * progress * progress;

  if (randomValue < fourthAcornChance) {
    return 4;
  }
  if (randomValue < thirdAcornChance) {
    return 3;
  }
  if (randomValue < secondAcornChance) {
    return 2;
  }
  return 1;
}
