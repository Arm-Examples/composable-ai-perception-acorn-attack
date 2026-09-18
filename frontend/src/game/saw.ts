import type { Rectangle } from "../detection/types";

const SAW_VIEWPORT_WIDTH_RATIO = 0.1;

export function pinSawToDetection(
  detection: Rectangle,
  viewportWidth: number,
): Rectangle {
  const size = viewportWidth * SAW_VIEWPORT_WIDTH_RATIO;
  const centreX = detection.x + detection.width / 2;
  const centreY = detection.y + detection.height / 2;

  return {
    x: centreX - size / 2,
    y: centreY - size / 2,
    width: size,
    height: size,
  };
}
