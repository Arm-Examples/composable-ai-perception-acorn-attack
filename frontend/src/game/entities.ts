import type { Rectangle } from "../detection/types";

export const ACORN_SIZE = { width: 90, height: 104 };
export const BOMB_SIZE = { width: 80, height: 105 };

export type FallingKind = "acorn" | "bomb";

export interface FallingItem extends Rectangle {
  kind: FallingKind;
  velocityX: number;
  velocityY: number;
}

export interface Fragment extends Rectangle {
  angularVelocity: number;
  rotation: number;
  sprite: HTMLImageElement;
  velocityX: number;
  velocityY: number;
}

export interface Effect extends Rectangle {
  remainingMs: number;
  sprite: HTMLImageElement;
}
