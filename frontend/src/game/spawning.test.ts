import { describe, expect, it } from "vitest";

import { spawnCountForDifficulty } from "./spawning";

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
