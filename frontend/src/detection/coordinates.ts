import type { Rectangle } from "./types";

interface Size {
  width: number;
  height: number;
}

export function coverAndMirror(
  box: Rectangle,
  source: Size,
  destination: Size,
): Rectangle {
  const scale = Math.max(
    destination.width / source.width,
    destination.height / source.height,
  );
  const offsetX = (destination.width - source.width * scale) / 2;
  const offsetY = (destination.height - source.height * scale) / 2;
  const width = box.width * scale;

  return {
    x: destination.width - (box.x * scale + offsetX) - width,
    y: box.y * scale + offsetY,
    width,
    height: box.height * scale,
  };
}
