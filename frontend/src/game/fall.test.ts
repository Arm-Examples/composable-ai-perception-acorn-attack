import { describe, expect, it } from "vitest";

import { calculateFall } from "./fall";

describe("calculateFall", () => {
  it("adds a small horizontal velocity", () => {
    const fall = calculateFall(
      200,
      { width: 800, height: 600 },
      { width: 90, height: 104 },
      1,
    );

    expect(fall.velocityX).toBeCloseTo(24);
    expect(fall.velocityY).toBe(110);
    expect(fall.destinationX).toBeCloseTo(353.6);
  });

  it("adjusts the velocity to keep the destination inside the left edge", () => {
    const fall = calculateFall(
      10,
      { width: 800, height: 600 },
      { width: 90, height: 104 },
      0,
    );

    expect(fall.destinationX).toBe(0);
    expect(fall.velocityX).toBeGreaterThanOrEqual(-24);
  });

  it("adjusts the velocity to keep the whole acorn inside the right edge", () => {
    const viewport = { width: 800, height: 600 };
    const item = { width: 90, height: 104 };

    const fall = calculateFall(viewport.width - item.width, viewport, item, 1);

    expect(fall.destinationX + item.width).toBe(viewport.width);
    expect(fall.velocityX).toBe(0);
  });
});
