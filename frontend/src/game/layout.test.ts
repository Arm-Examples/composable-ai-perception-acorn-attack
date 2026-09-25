import { describe, expect, it } from "vitest";

import { integerScale } from "./layout";

describe("integerScale", () => {
  it("rounds down to the largest whole scale that fits", () => {
    const scale = integerScale(420, 93, 10);

    expect(scale).toBe(4);
  });

  it("caps the scale at the maximum", () => {
    const scale = integerScale(2_000, 58, 4);

    expect(scale).toBe(4);
  });

  it("never returns less than one", () => {
    const scale = integerScale(10, 58, 4);

    expect(scale).toBe(1);
  });
});
