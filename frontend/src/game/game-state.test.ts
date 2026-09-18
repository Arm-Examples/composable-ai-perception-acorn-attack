import { describe, expect, it } from "vitest";

import { countdownLabel } from "./game-state";

describe("countdownLabel", () => {
  it.each([
    [0, "3"],
    [999, "3"],
    [1_000, "2"],
    [2_000, "1"],
    [3_000, "GO!"],
    [3_999, "GO!"],
  ])("shows %s milliseconds as %s", (elapsedMs, expected) => {
    const label = countdownLabel(elapsedMs);

    expect(label).toBe(expected);
  });
});
