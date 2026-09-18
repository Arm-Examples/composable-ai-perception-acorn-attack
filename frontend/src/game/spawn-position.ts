import type { Rectangle } from "../detection/types";
import { intersects } from "./collision";

const SPAWN_GAP_PX = 8;

export function findSpawnX(
  viewportWidth: number,
  item: Pick<Rectangle, "width" | "height">,
  occupied: Rectangle[],
  randomValue: number,
): number | null {
  const availableWidth = viewportWidth - item.width;
  if (availableWidth < 0) {
    return null;
  }

  const slotCount = Math.max(
    1,
    Math.floor((viewportWidth + SPAWN_GAP_PX) / (item.width + SPAWN_GAP_PX)),
  );
  const firstSlot = Math.min(
    Math.floor(Math.min(Math.max(randomValue, 0), 0.999_999) * slotCount),
    slotCount - 1,
  );

  for (let offset = 0; offset < slotCount; offset += 1) {
    const slot = (firstSlot + offset) % slotCount;
    const x = slotCount === 1 ? 0 : (slot / (slotCount - 1)) * availableWidth;
    const candidate = { x, y: -item.height, ...item };
    if (!occupied.some((existing) => intersects(candidate, existing))) {
      return x;
    }
  }

  return null;
}
