import type { Detection, DetectionEvent, Rectangle } from "./types";

const MAX_DETECTION_AGE_MS = 250;
const MINIMUM_DETECTION_CONFIDENCE = 0.5;
const RECONNECT_DELAY_MS = 1_000;

export class DetectionConnection {
  private boxes: Rectangle[] = [];
  private receivedAtMs = 0;
  private reconnectTimer: number | undefined;
  private socket: WebSocket | undefined;
  private stopped = false;

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.socket?.close();
    if (this.reconnectTimer !== undefined) {
      window.clearTimeout(this.reconnectTimer);
    }
  }

  currentBoxes(nowMs: number): Rectangle[] {
    if (nowMs - this.receivedAtMs > MAX_DETECTION_AGE_MS) {
      return [];
    }
    return this.boxes;
  }

  private connect(): void {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.socket = new WebSocket(`${protocol}//${window.location.host}/events`);
    this.socket.addEventListener("message", (event) => {
      const detectionEvent = parseDetectionEvent(event.data);
      if (detectionEvent === null) {
        return;
      }
      this.boxes = visibleDetectionBoxes(detectionEvent.detections);
      this.receivedAtMs = performance.now();
    });
    this.socket.addEventListener("close", () => {
      this.boxes = [];
      if (!this.stopped) {
        this.reconnectTimer = window.setTimeout(
          () => this.connect(),
          RECONNECT_DELAY_MS,
        );
      }
    });
  }
}

function parseDetectionEvent(value: unknown): DetectionEvent | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || !Array.isArray(parsed.detections)) {
      return null;
    }

    const detections = parsed.detections.flatMap((detection) => {
      if (!isRecord(detection)) {
        return [];
      }
      return [
        {
          box: isRectangle(detection.box) ? detection.box : null,
          confidence:
            typeof detection.confidence === "number"
              ? detection.confidence
              : undefined,
        },
      ];
    });
    return { detections };
  } catch {
    return null;
  }
}

export function visibleDetectionBoxes(detections: Detection[]): Rectangle[] {
  return detections.flatMap(({ box, confidence }) => {
    if (
      box === null ||
      (confidence !== null &&
        confidence !== undefined &&
        confidence < MINIMUM_DETECTION_CONFIDENCE)
    ) {
      return [];
    }
    return [box];
  });
}

function isRectangle(value: unknown): value is Rectangle {
  return (
    isRecord(value) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.width === "number" &&
    typeof value.height === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
