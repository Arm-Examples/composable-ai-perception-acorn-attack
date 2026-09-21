import type { Rectangle } from "../detection/types";

export function intersects(first: Rectangle, second: Rectangle): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export function intersectsCircularBounds(
  rectangle: Rectangle,
  circleBounds: Rectangle,
): boolean {
  const centreX = circleBounds.x + circleBounds.width / 2;
  const centreY = circleBounds.y + circleBounds.height / 2;
  const radius = Math.min(circleBounds.width, circleBounds.height) / 2;
  const closestX = Math.max(
    rectangle.x,
    Math.min(centreX, rectangle.x + rectangle.width),
  );
  const closestY = Math.max(
    rectangle.y,
    Math.min(centreY, rectangle.y + rectangle.height),
  );
  const distanceX = centreX - closestX;
  const distanceY = centreY - closestY;

  return distanceX * distanceX + distanceY * distanceY < radius * radius;
}
