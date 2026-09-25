import { describe, expect, it } from "vitest";

import { fitPixelSize, layoutText } from "./text-layout";

describe("fitPixelSize", () => {
  it("chooses the largest whole pixel size that fits the box width", () => {
    const pixelSize = fitPixelSize(["123"], { width: 100, height: 100 }, 20);

    expect(pixelSize).toBe(5);
  });

  it("limits the pixel size by the height of every line", () => {
    const pixelSize = fitPixelSize(["1", "2"], { width: 100, height: 48 }, 20);

    expect(pixelSize).toBe(3);
  });

  it("caps the pixel size at the maximum", () => {
    const pixelSize = fitPixelSize(["1"], { width: 1_000, height: 1_000 }, 4);

    expect(pixelSize).toBe(4);
  });

  it("never returns less than one pixel", () => {
    const pixelSize = fitPixelSize(["too long"], { width: 10, height: 10 }, 4);

    expect(pixelSize).toBe(1);
  });
});

describe("layoutText", () => {
  it("centres a single line on the capital height", () => {
    const block = layoutText(["GO!"], { x: 100, y: 50 }, 2);

    expect(block).toEqual({
      fontSize: 18,
      lines: [{ text: "GO!", x: 83, baselineY: 56 }],
    });
  });

  it("centres each line of a block independently", () => {
    const block = layoutText(["Last score:", "7"], { x: 200, y: 100 }, 1);

    expect(block).toEqual({
      fontSize: 9,
      lines: [
        { text: "Last score:", x: 168, baselineY: 98 },
        { text: "7", x: 198, baselineY: 108 },
      ],
    });
  });
});
