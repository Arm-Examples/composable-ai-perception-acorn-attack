import { describe, expect, it } from "vitest";

import { visibleDetectionBoxes } from "./connection";

const BOX = { x: 10, y: 20, width: 30, height: 40 };

describe("visibleDetectionBoxes", () => {
  it("hides detections below 50% confidence", () => {
    const boxes = visibleDetectionBoxes([
      { box: BOX, confidence: 0.49 },
      { box: { ...BOX, x: 50 }, confidence: 0.5 },
    ]);

    expect(boxes).toEqual([{ ...BOX, x: 50 }]);
  });

  it("shows detections without confidence", () => {
    const boxes = visibleDetectionBoxes([
      { box: BOX },
      { box: { ...BOX, x: 50 }, confidence: null },
    ]);

    expect(boxes).toEqual([BOX, { ...BOX, x: 50 }]);
  });

  it("ignores detections without a box", () => {
    const boxes = visibleDetectionBoxes([{ box: null, confidence: 0.9 }]);

    expect(boxes).toEqual([]);
  });
});
