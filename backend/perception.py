import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from cairn_sdk import CameraService, Notification, NotificationService
from cairn_sdk.perception import (
    PerceptionResult,
    PerceptionResultError,
    PerceptionService,
    PerceptionSession,
    PerceptionWorkflow,
)
from cairn_sdk.perception.types import BoxDetectionsT

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


async def _get_first_camera():
    first_camera = CameraService(CAMERA_ENDPOINT).list_cameras()[0]
    stream_configuration = await first_camera.get_stream_configurations(
        resolution=CAMERA_RESOLUTION, pixel_format="YUY2"
    )
    if not stream_configuration:
        width, height = CAMERA_RESOLUTION
        raise RuntimeError(f"camera has no {width}x{height} YUY2 stream")

    return stream_configuration[0]


async def _deploy_inference_pipeline() -> tuple[PerceptionSession, str]:
    camera = await _get_first_camera()
    service = await PerceptionService.connect(PERCEPTION_ENDPOINT)

    workflow = PerceptionWorkflow("detection-workflow", camera)
    _ = workflow.infer("objects", "detection_model")

    session = await service.deploy(workflow)
    if session.topics is None:
        raise RuntimeError("deployment returned no results topic")

    return session, session.topics.results


def _decode_result(notification: Notification) -> dict[str, object]:
    result = PerceptionResult.decode(notification.payload)
    detections = [
        {
            "label": _text(detection.text),
            "confidence": detection.confidence,
            "classId": detection.classId,
            "box": (
                {
                    "x": detection.box.x,
                    "y": detection.box.y,
                    "width": detection.box.width,
                    "height": detection.box.height,
                }
                if detection.box is not None
                else None
            ),
        }
        for payload in result.payloads(BoxDetectionsT)
        for detection in payload.detections or []
    ]
    return {"detections": detections}


def _text(value: str | bytes | None) -> str | None:
    if isinstance(value, bytes):
        return value.decode(errors="replace")
    return value
