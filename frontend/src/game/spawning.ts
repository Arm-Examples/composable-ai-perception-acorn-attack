const INITIAL_SECOND_ACORN_CHANCE = 0.05;
const FINAL_THIRD_ACORN_CHANCE = 0.98;
const FINAL_FOURTH_ACORN_CHANCE = 0.9;
const BOMB_CHANCE_STEP_MS = 20_000;
const MAXIMUM_BOMB_CHANCE_TENTHS = 8;
const BOMB_SPEED_STEP_MS = 15_000;
const BOMB_SPEED_STEP_PERCENT = 10;
const INITIAL_BOMB_SPEED_PERCENT = 100;
const MAXIMUM_BOMB_SPEED_PERCENT = 300;

export function bombChanceForElapsedMs(elapsedMs: number): number {
  const elapsedSteps = Math.floor(Math.max(elapsedMs, 0) / BOMB_CHANCE_STEP_MS);
  return Math.min(elapsedSteps + 1, MAXIMUM_BOMB_CHANCE_TENTHS) / 10;
}

export function bombSpeedMultiplierForElapsedMs(elapsedMs: number): number {
  const elapsedSteps = Math.floor(Math.max(elapsedMs, 0) / BOMB_SPEED_STEP_MS);
  const speedPercent = Math.min(
    INITIAL_BOMB_SPEED_PERCENT + elapsedSteps * BOMB_SPEED_STEP_PERCENT,
    MAXIMUM_BOMB_SPEED_PERCENT,
  );
  return speedPercent / 100;
}

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
