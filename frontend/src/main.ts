import "./styles.css";

import { loadCameraSize } from "./config";
import { DetectionConnection } from "./detection/connection";
import { coverAndMirror } from "./detection/coordinates";
import type { Rectangle } from "./detection/types";
import { Game } from "./game/game";
import { pinSawToDetection } from "./game/saw";
import { loadSprites } from "./game/sprites";

const canvasElement = document.querySelector<HTMLCanvasElement>("#game");
if (canvasElement === null) {
  throw new Error("Game canvas is missing");
}
const canvas: HTMLCanvasElement = canvasElement;

const canvasContext = canvas.getContext("2d");
if (canvasContext === null) {
  throw new Error("Canvas 2D is unavailable");
}
const context: CanvasRenderingContext2D = canvasContext;

const cameraSize = await loadCameraSize();
await document.fonts.load('24px "Carrie Micro"');
const sprites = await loadSprites();
const detections = new DetectionConnection();
const game = new Game(context, sprites);
let previousFrameMs = performance.now();

detections.start();
window.addEventListener("beforeunload", () => detections.stop(), {
  once: true,
});

function frame(nowMs: number): void {
  const viewport = resizeCanvas(canvas, context);
  const cameraBoxes = detections.currentBoxes(nowMs);
  const detectionBoxes = cameraBoxes.map((box) =>
    coverAndMirror(box, cameraSize, viewport),
  );
  const saws = detectionBoxes.map((box) =>
    pinSawToDetection(box, viewport.width),
  );
  const elapsedMs = Math.min(nowMs - previousFrameMs, 50);

  game.update(elapsedMs, saws, viewport);
  game.render(saws, viewport);
  previousFrameMs = nowMs;
  window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);

function resizeCanvas(
  target: HTMLCanvasElement,
  targetContext: CanvasRenderingContext2D,
): Rectangle {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio;
  const backingWidth = Math.round(width * pixelRatio);
  const backingHeight = Math.round(height * pixelRatio);

  if (target.width !== backingWidth || target.height !== backingHeight) {
    target.width = backingWidth;
    target.height = backingHeight;
    targetContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  return { x: 0, y: 0, width, height };
}
