from contextlib import aclosing, asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

import perception
from settings import CAMERA_RESOLUTION


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with perception.detection_stream() as detections:
        app.state.detections = detections
        yield


app = FastAPI(lifespan=lifespan)


@app.get(path="/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/config")
def config() -> dict[str, dict[str, int]]:
    width, height = CAMERA_RESOLUTION
    return {"cameraSize": {"width": width, "height": height}}


@app.websocket("/events")
async def events(websocket: WebSocket):
    await websocket.accept()

    try:
        async with aclosing(app.state.detections.events()) as results:
            async for result in results:
                await websocket.send_json(result)
    except WebSocketDisconnect:
        pass


app.mount(
    "/",
    StaticFiles(
        directory=Path(__file__).resolve().parent.parent / "frontend" / "dist",
        html=True,
        check_dir=False,
    ),
    name="app",
)
