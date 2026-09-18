import { describe, expect, it } from "vitest";

import { findSpawnX } from "./spawn-position";

describe("findSpawnX", () => {
  it("chooses an unoccupied spawn slot", () => {
    const item = { width: 90, height: 104 };
    const occupied = [{ x: 0, y: -104, ...item }];

    const x = findSpawnX(400, item, occupied, 0);

    expect(x).not.toBeNull();
    expect(x).toBeGreaterThanOrEqual(90);
  });

  it("returns null when no item can fit", () => {
    const item = { width: 90, height: 104 };

    const x = findSpawnX(80, item, [], 0.5);

    expect(x).toBeNull();
  });
});
