import importlib.util
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def server(monkeypatch):
    async def events():
        yield {"detections": [{"box": {"x": 10, "y": 20, "width": 30, "height": 40}}]}

    @asynccontextmanager
    async def detection_stream():
        yield SimpleNamespace(events=events)

    monkeypatch.setitem(
        sys.modules,
        "perception",
        SimpleNamespace(detection_stream=detection_stream),
    )
    specification = importlib.util.spec_from_file_location(
        "server_under_test", Path(__file__).resolve().parents[1] / "main.py"
    )
    assert specification is not None and specification.loader is not None
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


def test_health_returns_ok(server):
    with TestClient(server.app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True}


@pytest.mark.parametrize("resolution", [(640, 480), (1280, 720)])
def test_config_returns_backend_camera_dimensions(server, monkeypatch, resolution):
    monkeypatch.setattr(server, "CAMERA_RESOLUTION", resolution)

    with TestClient(server.app) as client:
        response = client.get("/config")

    assert response.status_code == 200
    assert response.json() == {
        "cameraSize": {"width": resolution[0], "height": resolution[1]}
    }


def test_events_forwards_detections_as_json(server):
    with (
        TestClient(server.app) as client,
        client.websocket_connect("/events") as websocket,
    ):
        message = websocket.receive_json()

    assert message == {
        "detections": [{"box": {"x": 10, "y": 20, "width": 30, "height": 40}}]
    }
