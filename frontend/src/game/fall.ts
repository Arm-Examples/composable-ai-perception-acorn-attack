const VERTICAL_SPEED_PX_PER_SECOND = 110;
const MAX_HORIZONTAL_SPEED_PX_PER_SECOND = 24;

interface Size {
  width: number;
  height: number;
}

export interface AcornFall {
  destinationX: number;
  velocityX: number;
  velocityY: number;
}

export function calculateFall(
  startX: number,
  viewport: Size,
  item: Size,
  randomValue: number,
): AcornFall {
  const availableWidth = Math.max(0, viewport.width - item.width);
  const fallDurationSeconds =
    (viewport.height + item.height) / VERTICAL_SPEED_PX_PER_SECOND;
  const direction = Math.min(Math.max(randomValue, 0), 1) * 2 - 1;
  const proposedVelocityX = direction * MAX_HORIZONTAL_SPEED_PX_PER_SECOND;
  const destinationX = Math.min(
    Math.max(startX + proposedVelocityX * fallDurationSeconds, 0),
    availableWidth,
  );

  return {
    destinationX,
    velocityX: (destinationX - startX) / fallDurationSeconds,
    velocityY: VERTICAL_SPEED_PX_PER_SECOND,
  };
}
