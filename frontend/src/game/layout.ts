import type { Rectangle } from "../detection/types";
import { ACORN_SIZE } from "./entities";

export function startAcorn(viewport: Rectangle): Rectangle {
  return {
    x: viewport.width * 0.72 - ACORN_SIZE.width / 2,
    y: viewport.height * 0.52 - ACORN_SIZE.height / 2,
    ...ACORN_SIZE,
  };
}

export function integerScale(
  availablePx: number,
  nativePx: number,
  maxScale: number,
): number {
  return Math.max(1, Math.min(Math.floor(availablePx / nativePx), maxScale));
}
