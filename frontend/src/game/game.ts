import type { Rectangle } from "../detection/types";
import { intersectsCircularBounds } from "./collision";
import {
  ACORN_SIZE,
  BOMB_SIZE,
  type Effect,
  type FallingItem,
  type FallingKind,
  type Fragment,
} from "./entities";
import { calculateFall } from "./fall";
import { COUNTDOWN_DURATION_MS, type GameMode } from "./game-state";
import { startAcorn } from "./layout";
import { GameRenderer } from "./renderer";
import { findSpawnX } from "./spawn-position";
import {
  bombChanceForElapsedMs,
  bombSpeedMultiplierForElapsedMs,
  spawnCountForDifficulty,
} from "./spawning";
import type { Sprites } from "./sprites";

const FRAGMENT_SIZE = 86;
const GRAVITY_PX_PER_SECOND_SQUARED = 1000;
const BEGINNING_SPAWN_INTERVAL_MS = 1_000;
const SPAWN_INTERVAL_ACCELERATION_MS = 50;
const MIN_SPAWN_INTERVAL_MS = 200;
const MAXIMUM_DIFFICULTY_AFTER_MS = 120_000;
const START_HOVER_MS = 3_000;
const MAX_LIVES = 3;
const SLASH_DURATION_MS = 250;
const EXPLOSION_DURATION_MS = 600;

export class Game {
  private readonly fallingItems: FallingItem[] = [];
  private readonly fragments: Fragment[] = [];
  private readonly effects: Effect[] = [];
  private readonly renderer: GameRenderer;
  private mode: GameMode = "home";
  private hoverMs = 0;
  private countdownMs = 0;
  private roundElapsedMs = 0;
  private msUntilSpawn = 0;
  private currentSpawnIntervalMs = BEGINNING_SPAWN_INTERVAL_MS;
  private lives = MAX_LIVES;
  private score = 0;
  private lastScore: number | null = null;

  constructor(
    context: CanvasRenderingContext2D,
    private readonly sprites: Sprites,
  ) {
    this.renderer = new GameRenderer(context, sprites);
  }

  update(elapsedMs: number, saws: Rectangle[], viewport: Rectangle): void {
    if (this.mode === "home") {
      this.updateHome(elapsedMs, saws, viewport);
      return;
    }
    if (this.mode === "countdown") {
      this.updateCountdown(elapsedMs);
      return;
    }

    this.updateRunning(elapsedMs, saws, viewport);
  }

  render(saws: Rectangle[], viewport: Rectangle): void {
    this.renderer.render(
      {
        countdownMs: this.countdownMs,
        effects: this.effects,
        fallingItems: this.fallingItems,
        fragments: this.fragments,
        lastScore: this.lastScore,
        lives: this.lives,
        mode: this.mode,
        roundElapsedMs: this.roundElapsedMs,
        score: this.score,
      },
      saws,
      viewport,
    );
  }

  private updateHome(
    elapsedMs: number,
    saws: Rectangle[],
    viewport: Rectangle,
  ): void {
    const target = startAcorn(viewport);
    this.hoverMs = saws.some((saw) => intersectsCircularBounds(target, saw))
      ? this.hoverMs + elapsedMs
      : 0;

    if (this.hoverMs >= START_HOVER_MS) {
      this.mode = "countdown";
      this.countdownMs = 0;
      this.hoverMs = 0;
    }
  }

  private updateCountdown(elapsedMs: number): void {
    this.countdownMs += elapsedMs;
    if (this.countdownMs >= COUNTDOWN_DURATION_MS) {
      this.startRound();
    }
  }

  private updateRunning(
    elapsedMs: number,
    saws: Rectangle[],
    viewport: Rectangle,
  ): void {
    const elapsedSeconds = elapsedMs / 1_000;
    this.roundElapsedMs += elapsedMs;
    this.updateSpawning(elapsedMs, viewport);
    this.moveFallingItems(elapsedSeconds);
    this.moveFragments(elapsedSeconds);
    this.updateEffects(elapsedMs);
    this.resolveHits(saws, viewport);

    if (this.mode === "running") {
      this.resolveMisses(viewport);
    }
  }

  private startRound(): void {
    this.mode = "running";
    this.lives = MAX_LIVES;
    this.score = 0;
    this.roundElapsedMs = 0;
    this.msUntilSpawn = 0;
    this.currentSpawnIntervalMs = BEGINNING_SPAWN_INTERVAL_MS;
    this.fallingItems.length = 0;
    this.fragments.length = 0;
    this.effects.length = 0;
  }

  private endRound(): void {
    this.lastScore = this.score;
    this.mode = "home";
    this.hoverMs = 0;
    this.fallingItems.length = 0;
    this.fragments.length = 0;
    this.effects.length = 0;
  }

  private updateSpawning(elapsedMs: number, viewport: Rectangle): void {
    this.msUntilSpawn -= elapsedMs;
    if (this.msUntilSpawn > 0) {
      return;
    }

    const difficulty = this.roundElapsedMs / MAXIMUM_DIFFICULTY_AFTER_MS;
    const spawnCount = spawnCountForDifficulty(difficulty, Math.random());
    for (let count = 0; count < spawnCount; count += 1) {
      this.spawnFallingItem(viewport);
    }

    this.currentSpawnIntervalMs = Math.max(
      MIN_SPAWN_INTERVAL_MS,
      this.currentSpawnIntervalMs - SPAWN_INTERVAL_ACCELERATION_MS,
    );
    this.msUntilSpawn = this.currentSpawnIntervalMs;
  }

  private spawnFallingItem(viewport: Rectangle): void {
    const bombChance = bombChanceForElapsedMs(this.roundElapsedMs);
    const kind: FallingKind = Math.random() < bombChance ? "bomb" : "acorn";
    const size = kind === "bomb" ? BOMB_SIZE : ACORN_SIZE;
    const x = findSpawnX(
      viewport.width,
      size,
      this.fallingItems,
      Math.random(),
    );
    if (x === null) {
      return;
    }

    const fall = calculateFall(x, viewport, size, Math.random());
    const speedMultiplier =
      kind === "bomb"
        ? bombSpeedMultiplierForElapsedMs(this.roundElapsedMs)
        : 1;
    this.fallingItems.push({
      kind,
      x,
      y: -size.height,
      ...size,
      velocityX: fall.velocityX * speedMultiplier,
      velocityY: fall.velocityY * speedMultiplier,
    });
  }

  private moveFallingItems(elapsedSeconds: number): void {
    for (const item of this.fallingItems) {
      item.x += item.velocityX * elapsedSeconds;
      item.y += item.velocityY * elapsedSeconds;
    }
  }

  private moveFragments(elapsedSeconds: number): void {
    for (const fragment of this.fragments) {
      fragment.velocityY += GRAVITY_PX_PER_SECOND_SQUARED * elapsedSeconds;
      fragment.x += fragment.velocityX * elapsedSeconds;
      fragment.y += fragment.velocityY * elapsedSeconds;
      fragment.rotation += fragment.angularVelocity * elapsedSeconds;
    }
  }

  private updateEffects(elapsedMs: number): void {
    for (const effect of this.effects) {
      effect.remainingMs -= elapsedMs;
    }
    removeAll(this.effects, (effect) => effect.remainingMs <= 0);
  }

  private resolveHits(saws: Rectangle[], viewport: Rectangle): void {
    const hitItems = this.fallingItems.filter((item) =>
      saws.some((saw) => intersectsCircularBounds(item, saw)),
    );
    const hitBomb = hitItems.find((item) => item.kind === "bomb");

    if (hitBomb !== undefined) {
      this.addExplosion(hitBomb, viewport);
      this.fallingItems.length = 0;
      this.loseHearts(1);
      return;
    }

    for (const item of hitItems) {
      this.splitAcorn(item);
      this.addSlash(item);
      this.score += 1;
    }
    removeAll(this.fallingItems, (item) => hitItems.includes(item));
  }

  private resolveMisses(viewport: Rectangle): void {
    const missedItems = this.fallingItems.filter(
      (item) => item.y > viewport.height,
    );
    removeAll(this.fallingItems, (item) => missedItems.includes(item));
    removeAll(
      this.fragments,
      (fragment) =>
        fragment.y > viewport.height ||
        fragment.x + fragment.width < 0 ||
        fragment.x > viewport.width,
    );
  }

  private loseHearts(count: number): void {
    if (count === 0) {
      return;
    }
    this.lives = Math.max(0, this.lives - count);
    if (this.lives === 0) {
      this.endRound();
    }
  }

  private splitAcorn(acorn: FallingItem): void {
    const x = acorn.x + (acorn.width - FRAGMENT_SIZE) / 2;
    const y = acorn.y + (acorn.height - FRAGMENT_SIZE) / 2;
    this.fragments.push(
      {
        x,
        y,
        width: FRAGMENT_SIZE,
        height: FRAGMENT_SIZE,
        sprite: this.sprites.acornTop,
        velocityX: -180,
        velocityY: -250,
        rotation: 0,
        angularVelocity: -4,
      },
      {
        x,
        y,
        width: FRAGMENT_SIZE,
        height: FRAGMENT_SIZE,
        sprite: this.sprites.acornBottom,
        velocityX: 180,
        velocityY: -170,
        rotation: 0,
        angularVelocity: 4,
      },
    );
  }

  private addSlash(item: FallingItem): void {
    const width = 120;
    const height =
      width * (this.sprites.slash.height / this.sprites.slash.width);
    this.effects.push({
      x: item.x + item.width / 2 - width / 2,
      y: item.y + item.height / 2 - height / 2,
      width,
      height,
      sprite: this.sprites.slash,
      remainingMs: SLASH_DURATION_MS,
    });
  }

  private addExplosion(item: FallingItem, viewport: Rectangle): void {
    const size = Math.min(viewport.width * 0.35, 380);
    this.effects.push({
      x: item.x + item.width / 2 - size / 2,
      y: item.y + item.height / 2 - size / 2,
      width: size,
      height: size,
      sprite: this.sprites.explosion,
      remainingMs: EXPLOSION_DURATION_MS,
    });
  }
}

function removeAll<T>(items: T[], predicate: (item: T) => boolean): void {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item !== undefined && predicate(item)) {
      items.splice(index, 1);
    }
  }
}
