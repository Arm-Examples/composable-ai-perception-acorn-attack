export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  box: Rectangle | null;
  confidence?: number | null;
}

export interface DetectionEvent {
  detections: Detection[];
}
