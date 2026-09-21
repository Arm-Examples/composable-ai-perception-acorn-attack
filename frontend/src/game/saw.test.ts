import { describe, expect, it } from "vitest";

import { pinSawToDetection } from "./saw";

describe("pinSawToDetection", () => {
  it("centres a constant-size saw on the detection", () => {
    const detection = { x: 100, y: 200, width: 80, height: 40 };

    const saw = pinSawToDetection(detection, 1_200);

    expect(saw).toEqual({
      x: 110,
      y: 190,
      width: 60,
      height: 60,
    });
  });

  it("does not scale the saw with the detection size", () => {
    const smallDetection = { x: 100, y: 100, width: 10, height: 10 };
    const largeDetection = { x: 100, y: 100, width: 400, height: 300 };

    const smallDetectionSaw = pinSawToDetection(smallDetection, 1_000);
    const largeDetectionSaw = pinSawToDetection(largeDetection, 1_000);

    expect(smallDetectionSaw.width).toBe(50);
    expect(largeDetectionSaw.width).toBe(50);
  });
});
