import type { Rectangle } from "../detection/types";
import type { Effect, FallingItem, Fragment } from "./entities";
import { countdownLabel, type GameMode } from "./game-state";
import { integerScale, startAcorn } from "./layout";
import type { Sprites } from "./sprites";
import {
  FONT_PIXELS_PER_EM,
  fitPixelSize,
  layoutText,
  type Point,
} from "./text-layout";

const MAX_LIVES = 3;
const SAW_ROTATION_RADIANS_PER_MS = 0.002;
const MAX_LOGO_SCALE = 4;
const MAX_SIGN_SCALE = 4;
const MAX_HEADLINE_PIXEL_SIZE = 4;
const MAX_COUNTDOWN_PIXEL_SIZE = 13;
const HEART_GAP_PX = 6;
const SIGN_MARGIN_PX = 16;

// Wooden panel inside each sign sprite, in the sprite's own pixels.
const SIGN_PANEL: Rectangle = { x: 7, y: 3, width: 44, height: 28 };
const WIDE_SIGN_PANEL: Rectangle = { x: 6, y: 5, width: 61, height: 26 };
const SIGN_PANEL_PADDING_PX = 3;

export interface GameView {
  countdownMs: number;
  effects: readonly Effect[];
  fallingItems: readonly FallingItem[];
  fragments: readonly Fragment[];
  lastScore: number | null;
  lives: number;
  mode: GameMode;
  roundElapsedMs: number;
  score: number;
}

interface RotatedSprite extends Rectangle {
  rotation: number;
  sprite: HTMLImageElement;
}

export class GameRenderer {
  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly sprites: Sprites,
  ) {}

  render(view: GameView, saws: Rectangle[], viewport: Rectangle): void {
    this.context.imageSmoothingEnabled = false;
    this.renderBackground(viewport);

    if (view.mode === "running") {
      this.renderFallingItems(view.fallingItems);
    }
    for (const fragment of view.fragments) {
      this.drawRotated(fragment);
    }
    this.renderEffects(view.effects);

    this.renderTrees(viewport);

    if (view.mode === "home") {
      this.renderHome(view.lastScore, viewport);
    } else if (view.mode === "countdown") {
      this.renderCountdown(view.countdownMs, viewport);
    } else {
      this.renderHud(view.lives, view.score, viewport);
    }

    this.renderSaws(saws, view.mode, view.roundElapsedMs);
  }

  private renderBackground(viewport: Rectangle): void {
    const image = this.sprites.background;
    const scale = Math.max(
      viewport.width / image.width,
      viewport.height / image.height,
    );
    const width = image.width * scale;
    const height = image.height * scale;
    this.context.drawImage(
      image,
      (viewport.width - width) / 2,
      (viewport.height - height) / 2,
      width,
      height,
    );
  }

  private renderTrees(viewport: Rectangle): void {
    const width =
      viewport.height * (this.sprites.trees.width / this.sprites.trees.height);

    this.context.drawImage(
      this.sprites.trees,
      viewport.width - width,
      0,
      width,
      viewport.height,
    );
    this.context.save();
    this.context.translate(width, 0);
    this.context.scale(-1, 1);
    this.context.drawImage(this.sprites.trees, 0, 0, width, viewport.height);
    this.context.restore();
  }

  private renderHome(lastScore: number | null, viewport: Rectangle): void {
    const logo = this.sprites.logo;
    const logoScale = Math.min(
      integerScale(viewport.width * 0.42, logo.width, MAX_LOGO_SCALE),
      integerScale(viewport.height * 0.18, logo.height, MAX_LOGO_SCALE),
    );
    const logoY = Math.round(Math.max(24, viewport.height * 0.08));
    const logoHeight = logo.height * logoScale;
    this.drawScaled(
      logo,
      Math.round((viewport.width - logo.width * logoScale) / 2),
      logoY,
      logoScale,
    );

    this.drawText(
      ["Chop this acorn to begin"],
      { x: viewport.width / 2, y: logoY + logoHeight + 52 },
      integerScale(
        viewport.width / 32,
        FONT_PIXELS_PER_EM,
        MAX_HEADLINE_PIXEL_SIZE,
      ),
    );

    const target = startAcorn(viewport);
    this.context.drawImage(
      this.sprites.acorn,
      target.x,
      target.y,
      target.width,
      target.height,
    );

    if (lastScore !== null) {
      this.renderLastScore(lastScore, viewport);
    }
  }

  private renderLastScore(score: number, viewport: Rectangle): void {
    const sign = this.sprites.signWide;
    const scale = integerScale(
      viewport.width * 0.45,
      sign.width,
      MAX_SIGN_SCALE,
    );
    const panel = this.drawSign(
      sign,
      WIDE_SIGN_PANEL,
      Math.round((viewport.width - sign.width * scale) / 2),
      Math.round(
        Math.min(
          viewport.height * 0.72,
          viewport.height - sign.height * scale - SIGN_MARGIN_PX,
        ),
      ),
      scale,
    );
    this.drawTextInPanel(["Last score", String(score)], panel, scale, scale);
  }

  private renderCountdown(elapsedMs: number, viewport: Rectangle): void {
    this.drawText(
      [countdownLabel(elapsedMs)],
      { x: viewport.width / 2, y: viewport.height / 2 },
      integerScale(
        viewport.width / 6,
        FONT_PIXELS_PER_EM,
        MAX_COUNTDOWN_PIXEL_SIZE,
      ),
    );
  }

  private renderHud(lives: number, score: number, viewport: Rectangle): void {
    const wideSign = this.sprites.signWide;
    const sign = this.sprites.sign;
    const scale = integerScale(
      viewport.width * 0.38,
      wideSign.width,
      MAX_SIGN_SCALE,
    );
    const livesPanel = this.drawSign(
      wideSign,
      WIDE_SIGN_PANEL,
      SIGN_MARGIN_PX,
      viewport.height - wideSign.height * scale - SIGN_MARGIN_PX,
      scale,
    );
    this.renderHearts(lives, livesPanel);

    const scorePanel = this.drawSign(
      sign,
      SIGN_PANEL,
      viewport.width - sign.width * scale - SIGN_MARGIN_PX,
      viewport.height - sign.height * scale - SIGN_MARGIN_PX,
      scale,
    );
    this.drawTextInPanel(
      [String(score)],
      scorePanel,
      scale,
      Math.floor(scale * 1.5),
    );
  }

  private renderHearts(lives: number, panel: Rectangle): void {
    const heart = this.sprites.heart;
    const rowWidth = heart.width * MAX_LIVES + HEART_GAP_PX * (MAX_LIVES - 1);
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          (panel.width * 0.85) / rowWidth,
          (panel.height * 0.7) / heart.height,
        ),
      ),
    );
    const startX = Math.round(panel.x + (panel.width - rowWidth * scale) / 2);
    const y = Math.round(panel.y + (panel.height - heart.height * scale) / 2);

    for (let index = 0; index < MAX_LIVES; index += 1) {
      const sprite = index < lives ? heart : this.sprites.brokenHeart;
      this.drawScaled(
        sprite,
        startX + index * (heart.width + HEART_GAP_PX) * scale,
        y,
        scale,
      );
    }
  }

  private renderFallingItems(items: readonly FallingItem[]): void {
    for (const item of items) {
      this.drawRotated({
        ...item,
        sprite:
          item.kind === "bomb" ? this.sprites.bombPinecone : this.sprites.acorn,
      });
    }
  }

  private renderEffects(effects: readonly Effect[]): void {
    for (const effect of effects) {
      this.context.drawImage(
        effect.sprite,
        effect.x,
        effect.y,
        effect.width,
        effect.height,
      );
    }
  }

  private renderSaws(
    saws: Rectangle[],
    mode: GameMode,
    roundElapsedMs: number,
  ): void {
    const rotation =
      mode === "running" ? roundElapsedMs * SAW_ROTATION_RADIANS_PER_MS : 0;
    for (const saw of saws) {
      this.drawRotated({ ...saw, rotation, sprite: this.sprites.saw });
    }
  }

  private drawSign(
    sprite: HTMLImageElement,
    panel: Rectangle,
    x: number,
    y: number,
    scale: number,
  ): Rectangle {
    this.drawScaled(sprite, x, y, scale);
    return {
      x: x + panel.x * scale,
      y: y + panel.y * scale,
      width: panel.width * scale,
      height: panel.height * scale,
    };
  }

  private drawScaled(
    sprite: HTMLImageElement,
    x: number,
    y: number,
    scale: number,
  ): void {
    this.context.drawImage(
      sprite,
      x,
      y,
      sprite.width * scale,
      sprite.height * scale,
    );
  }

  private drawRotated(item: RotatedSprite): void {
    this.context.save();
    this.context.translate(item.x + item.width / 2, item.y + item.height / 2);
    this.context.rotate(item.rotation);
    this.context.drawImage(
      item.sprite,
      -item.width / 2,
      -item.height / 2,
      item.width,
      item.height,
    );
    this.context.restore();
  }

  private drawTextInPanel(
    lines: readonly string[],
    panel: Rectangle,
    signScale: number,
    maxPixelSize: number,
  ): void {
    const padding = SIGN_PANEL_PADDING_PX * signScale;
    const pixelSize = fitPixelSize(
      lines,
      { width: panel.width - padding * 2, height: panel.height - padding * 2 },
      maxPixelSize,
    );
    this.drawText(
      lines,
      { x: panel.x + panel.width / 2, y: panel.y + panel.height / 2 },
      pixelSize,
    );
  }

  private drawText(
    lines: readonly string[],
    centre: Point,
    pixelSize: number,
  ): void {
    const block = layoutText(lines, centre, pixelSize);
    this.context.save();
    this.context.font = `${block.fontSize}px "Carrie Micro"`;
    this.context.textAlign = "left";
    this.context.textBaseline = "alphabetic";
    this.context.lineJoin = "miter";
    this.context.lineWidth = Math.max(2, pixelSize);
    this.context.strokeStyle = "#30152f";
    this.context.fillStyle = "#fff1ce";
    for (const line of block.lines) {
      this.context.strokeText(line.text, line.x, line.baselineY);
    }
    for (const line of block.lines) {
      this.context.fillText(line.text, line.x, line.baselineY);
    }
    this.context.restore();
  }
}
