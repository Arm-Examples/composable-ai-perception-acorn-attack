export type GameMode = "home" | "countdown" | "running";

const COUNTDOWN_STEP_MS = 1_000;
const COUNTDOWN_LABELS = ["3", "2", "1", "GO!"] as const;

export const COUNTDOWN_DURATION_MS =
  COUNTDOWN_STEP_MS * COUNTDOWN_LABELS.length;

export function countdownLabel(elapsedMs: number): string {
  const index = Math.min(
    Math.floor(Math.max(elapsedMs, 0) / COUNTDOWN_STEP_MS),
    COUNTDOWN_LABELS.length - 1,
  );
  return COUNTDOWN_LABELS[index] ?? "GO!";
}
