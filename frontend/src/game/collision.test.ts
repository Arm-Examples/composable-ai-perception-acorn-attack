import { describe, expect, it } from "vitest";

import { intersects } from "./collision";

describe("intersects", () => {
  it("returns true when a detection overlaps an acorn", () => {
    const acorn = { x: 100, y: 100, width: 90, height: 104 };
    const detection = { x: 150, y: 150, width: 80, height: 80 };

    const result = intersects(acorn, detection);

    expect(result).toBe(true);
  });

  it("returns false when rectangles only touch at an edge", () => {
    const acorn = { x: 100, y: 100, width: 90, height: 104 };
    const detection = { x: 190, y: 100, width: 80, height: 80 };

    const result = intersects(acorn, detection);

    expect(result).toBe(false);
  });
});
