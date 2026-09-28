def keep_label(
    detections: list[dict[str, object]], label: str | None
) -> list[dict[str, object]]:
    wanted = (label or "").strip().casefold()
    if not wanted:
        return detections

    return [
        detection
        for detection in detections
        if _matches(detection.get("label"), wanted)
    ]


def _matches(detection_label: object, wanted: str) -> bool:
    if not isinstance(detection_label, str) or not detection_label:
        return True
    return detection_label.casefold() == wanted
