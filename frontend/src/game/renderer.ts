import type { Rectangle } from "../detection/types";
import type { Effect, FallingItem, Fragment } from "./entities";
import { countdownLabel, type GameMode } from "./game-state";
import { startAcorn } from "./layout";
import type { Sprites } from "./sprites";

const MAX_LIVES = 3;
const SAW_ROTATION_RADIANS_PER_MS = 0.002;

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
      this.renderFragments(view.fragments);
      this.renderEffects(view.effects);
    }

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
    const logoWidth = Math.min(viewport.width * 0.42, 420);
    const logoHeight =
      logoWidth * (this.sprites.logo.height / this.sprites.logo.width);
    const logoY = Math.max(24, viewport.height * 0.08);
    this.context.drawImage(
      this.sprites.logo,
      (viewport.width - logoWidth) / 2,
      logoY,
      logoWidth,
      logoHeight,
    );

    this.drawText(
      "Chop this acorn to begin",
      viewport.width / 2,
      logoY + logoHeight + 52,
      Math.min(36, Math.max(20, viewport.width / 32)),
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
    const width = Math.min(296, viewport.width * 0.45);
    const height =
      width * (this.sprites.signWide.height / this.sprites.signWide.width);
    const x = (viewport.width - width) / 2;
    const y = viewport.height * 0.72;
    this.context.drawImage(this.sprites.signWide, x, y, width, height);
    this.drawText(
      `Last score: ${score}`,
      x + width / 2,
      y + height * 0.6,
      Math.min(28, width / 11),
    );
  }

  private renderCountdown(elapsedMs: number, viewport: Rectangle): void {
    this.drawText(
      countdownLabel(elapsedMs),
      viewport.width / 2,
      viewport.height / 2,
      Math.min(120, viewport.width / 6),
    );
  }

  private renderHud(lives: number, score: number, viewport: Rectangle): void {
    const wideWidth = Math.min(296, viewport.width * 0.38);
    const wideHeight =
      wideWidth * (this.sprites.signWide.height / this.sprites.signWide.width);
    const signWidth = Math.min(232, viewport.width * 0.3);
    const signHeight =
      signWidth * (this.sprites.sign.height / this.sprites.sign.width);
    const margin = 16;
    const wideY = viewport.height - wideHeight - margin;
    const signX = viewport.width - signWidth - margin;
    const signY = viewport.height - signHeight - margin;

    this.context.drawImage(
      this.sprites.signWide,
      margin,
      wideY,
      wideWidth,
      wideHeight,
    );
    this.renderHearts(lives, margin, wideY, wideWidth, wideHeight);

    this.context.drawImage(
      this.sprites.sign,
      signX,
      signY,
      signWidth,
      signHeight,
    );
    this.drawText(
      String(score),
      signX + signWidth / 2,
      signY + signHeight * 0.62,
      Math.min(48, signWidth / 3.5),
    );
  }

  private renderHearts(
    lives: number,
    signX: number,
    signY: number,
    signWidth: number,
    signHeight: number,
  ): void {
    const heartHeight = signHeight * 0.38;
    const heartWidth =
      heartHeight * (this.sprites.heart.width / this.sprites.heart.height);
    const gap = heartWidth * 0.3;
    const totalWidth = heartWidth * MAX_LIVES + gap * (MAX_LIVES - 1);
    const startX = signX + (signWidth - totalWidth) / 2;
    const y = signY + (signHeight - heartHeight) / 2;

    for (let index = 0; index < MAX_LIVES; index += 1) {
      const sprite =
        index < lives ? this.sprites.heart : this.sprites.brokenHeart;
      this.context.drawImage(
        sprite,
        startX + index * (heartWidth + gap),
        y,
        heartWidth,
        heartHeight,
      );
    }
  }

  private renderFallingItems(items: readonly FallingItem[]): void {
    for (const item of items) {
      const sprite =
        item.kind === "bomb" ? this.sprites.bombPinecone : this.sprites.acorn;
      this.context.drawImage(sprite, item.x, item.y, item.width, item.height);
    }
  }

  private renderFragments(fragments: readonly Fragment[]): void {
    for (const fragment of fragments) {
      this.context.save();
      this.context.translate(
        fragment.x + fragment.width / 2,
        fragment.y + fragment.height / 2,
      );
      this.context.rotate(fragment.rotation);
      this.context.drawImage(
        fragment.sprite,
        -fragment.width / 2,
        -fragment.height / 2,
        fragment.width,
        fragment.height,
      );
      this.context.restore();
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
      this.context.save();
      this.context.translate(saw.x + saw.width / 2, saw.y + saw.height / 2);
      this.context.rotate(rotation);
      this.context.drawImage(
        this.sprites.saw,
        -saw.width / 2,
        -saw.height / 2,
        saw.width,
        saw.height,
      );
      this.context.restore();
    }
  }

  private drawText(text: string, x: number, y: number, fontSize: number): void {
    this.context.save();
    this.context.font = `${fontSize}px "Carrie Micro"`;
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    this.context.lineJoin = "round";
    this.context.lineWidth = Math.max(3, fontSize * 0.12);
    this.context.strokeStyle = "#30152f";
    this.context.fillStyle = "#fff1ce";
    this.context.strokeText(text, x, y);
    this.context.fillText(text, x, y);
    this.context.restore();
  }
}
