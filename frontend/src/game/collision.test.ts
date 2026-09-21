import { describe, expect, it } from "vitest";

import { intersects, intersectsCircularBounds } from "./collision";

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

describe("intersectsCircularBounds", () => {
  it("excludes transparent corners around a circular sprite", () => {
    const item = { x: 0, y: 0, width: 10, height: 10 };
    const spriteBounds = { x: 0, y: 0, width: 100, height: 100 };

    const result = intersectsCircularBounds(item, spriteBounds);

    expect(result).toBe(false);
  });

  it("includes the visible edge of a circular sprite", () => {
    const item = { x: 45, y: 0, width: 10, height: 10 };
    const spriteBounds = { x: 0, y: 0, width: 100, height: 100 };

    const result = intersectsCircularBounds(item, spriteBounds);

    expect(result).toBe(true);
  });
});
