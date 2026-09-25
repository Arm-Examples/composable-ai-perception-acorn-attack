import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from cairn_sdk import CameraService, Notification, NotificationService
from cairn_sdk.perception import (
    BoxDetections,
    PerceptionResult,
    PerceptionResultError,
    PerceptionService,
    PerceptionSession,
    PerceptionWorkflow,
)

from settings import (
    CAMERA_ENDPOINT,
    CAMERA_RESOLUTION,
    PERCEPTION_ENDPOINT,
    REDIS_ENDPOINT,
)

LOGGER = logging.getLogger(__name__)


class DetectionStream:
    def __init__(self, notifications: NotificationService, channel: str) -> None:
        self._notifications = notifications
        self._channel = channel

    async def events(self) -> AsyncIterator[dict[str, object]]:
        results: asyncio.Queue[dict[str, object]] = asyncio.Queue(maxsize=1)

        async def receive_result(notification: Notification) -> None:
            try:
                result = _decode_result(notification)
            except PerceptionResultError:
                LOGGER.exception("Failed to decode perception result")
                return

            if results.full():
                _ = results.get_nowait()
            results.put_nowait(result)

        subscription = await self._notifications.subscribe(
            self._channel,
            receive_result,
        )
        try:
            while True:
                yield await results.get()
        finally:
            await self._notifications.unsubscribe(subscription)


@asynccontextmanager
async def detection_stream() -> AsyncIterator[DetectionStream]:
    session, notification_channel = await _deploy_inference_pipeline()
    async with NotificationService(REDIS_ENDPOINT) as notifications:
        try:
            yield DetectionStream(notifications, notification_channel)
        finally:
            await session.stop()


async def _get_camera_configuration():
    cameras = CameraService(CAMERA_ENDPOINT).list_cameras()
    for camera in cameras:
        for pixel_format in ("RGB", "YUY2"):
            stream_configurations = await camera.get_stream_configurations(
                resolution=CAMERA_RESOLUTION,
                pixel_format=pixel_format,
                frame_rate=(30, 1),
            )
            if stream_configurations:
                return stream_configurations[0]

    width, height = CAMERA_RESOLUTION
    raise RuntimeError(f"camera has no {width}x{height} RGB or YUY2 stream at 30 fps")


async def _deploy_inference_pipeline() -> tuple[PerceptionSession, str]:
    camera = await _get_camera_configuration()
    service = await PerceptionService.connect(PERCEPTION_ENDPOINT)

    workflow = PerceptionWorkflow("detection-workflow", camera)
    _ = workflow.infer("objects", "detection_model")

    session = await service.deploy(workflow)
    notification_channel = session.topics.results
    if notification_channel is None:
        raise RuntimeError("deployment returned no results topic")

    return session, notification_channel


def _decode_result(notification: Notification) -> dict[str, object]:
    result = PerceptionResult.decode(notification.payload)
    detections = [
        {
            "label": _text(detection.text),
            "confidence": detection.confidence,
            "classId": detection.class_id,
            "box": (
                {
                    "x": detection.bounding_box.x,
                    "y": detection.bounding_box.y,
                    "width": detection.bounding_box.width,
                    "height": detection.bounding_box.height,
                }
                if detection.bounding_box is not None
                else None
            ),
        }
        for payload in result.entries
        if isinstance(payload, BoxDetections)
        for detection in payload.detections or []
    ]
    print(f"detections: {detections}")
    return {"detections": detections}


def _text(value: str | bytes | None) -> str | None:
    if isinstance(value, bytes):
        return value.decode(errors="replace")
    return value
