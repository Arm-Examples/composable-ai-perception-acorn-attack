export async function loadCameraSize(): Promise<{
  width: number;
  height: number;
}> {
  const response = await fetch("/config", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Failed to load game configuration: HTTP ${response.status}`,
    );
  }

  const config = (await response.json()) as {
    cameraSize?: { width?: unknown; height?: unknown };
  } | null;
  const size = config?.cameraSize;
  if (
    typeof size?.width !== "number" ||
    typeof size.height !== "number" ||
    !Number.isInteger(size.width) ||
    !Number.isInteger(size.height) ||
    size.width <= 0 ||
    size.height <= 0
  ) {
    throw new Error(
      "Game configuration must provide positive integer camera dimensions",
    );
  }

  return { width: size.width, height: size.height };
}
