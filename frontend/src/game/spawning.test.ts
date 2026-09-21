import { describe, expect, it } from "vitest";

import {
  bombChanceForElapsedMs,
  bombSpeedMultiplierForElapsedMs,
  spawnCountForDifficulty,
} from "./spawning";

describe("bombChanceForElapsedMs", () => {
  it.each([
    [-1, 0.1],
    [0, 0.1],
    [19_999, 0.1],
    [20_000, 0.2],
    [39_999, 0.2],
    [40_000, 0.3],
    [120_000, 0.7],
    [140_000, 0.8],
    [160_000, 0.8],
  ])("returns %s milliseconds as a %s bomb chance", (elapsedMs, expected) => {
    const chance = bombChanceForElapsedMs(elapsedMs);

    expect(chance).toBe(expected);
  });
});

describe("bombSpeedMultiplierForElapsedMs", () => {
  it.each([
    [-1, 1],
    [0, 1],
    [14_999, 1],
    [15_000, 1.1],
    [29_999, 1.1],
    [30_000, 1.2],
    [285_000, 2.9],
    [300_000, 3],
    [450_000, 3],
  ])("returns %s milliseconds as a %sx multiplier", (elapsedMs, expected) => {
    const multiplier = bombSpeedMultiplierForElapsedMs(elapsedMs);

    expect(multiplier).toBe(expected);
  });
});

describe("spawnCountForDifficulty", () => {
  it("starts with one guaranteed acorn and a small chance of a second", () => {
    const usualSpawn = spawnCountForDifficulty(0, 0.5);
    const luckySpawn = spawnCountForDifficulty(0, 0.01);

    expect(usualSpawn).toBe(1);
    expect(luckySpawn).toBe(2);
  });

  it("ends with four acorns usually and at least three almost always", () => {
    const usualSpawn = spawnCountForDifficulty(1, 0.5);
    const lessLikelySpawn = spawnCountForDifficulty(1, 0.95);
    const rareSpawn = spawnCountForDifficulty(1, 0.99);

    expect(usualSpawn).toBe(4);
    expect(lessLikelySpawn).toBe(3);
    expect(rareSpawn).toBe(2);
  });

  it("clamps difficulty outside its expected range", () => {
    const beforeStart = spawnCountForDifficulty(-1, 0.5);
    const afterEnd = spawnCountForDifficulty(2, 0.5);

    expect(beforeStart).toBe(1);
    expect(afterEnd).toBe(4);
  });
});
