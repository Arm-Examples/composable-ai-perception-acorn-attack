import { describe, expect, it } from "vitest";

import { coverAndMirror } from "./coordinates";

describe("coverAndMirror", () => {
  it("covers a wide viewport, centre-crops it, and mirrors the box", () => {
    const box = { x: 100, y: 100, width: 50, height: 50 };

    const transformed = coverAndMirror(
      box,
      { width: 640, height: 480 },
      { width: 1280, height: 720 },
    );

    expect(transformed).toEqual({
      x: 980,
      y: 80,
      width: 100,
      height: 100,
    });
  });
});
