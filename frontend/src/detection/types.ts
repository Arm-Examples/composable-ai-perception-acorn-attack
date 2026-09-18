export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Detection {
  box: Rectangle | null;
}

export interface DetectionEvent {
  detections: Detection[];
}
