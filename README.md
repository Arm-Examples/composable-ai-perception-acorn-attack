# Cairn:Perception Acorn Attack

This example shows how you can use the Cairn SDK to create a vision inference model powered browser game.
With Cairn, the complex work of configuring cameras, setting up gstreamer pipelines and messaging is all handled for you.
You can see how we configured it in this project, in backend/perception.

## Quick Deploy
This project must be deployed to a Linux Arm device, with a usb camera or Pi Camera.

Topo allows you to clone a repository to your development machine, and deploy it
either locally or to another device (Such as a raspberry pi)

1. Install [Topo](https://developer.arm.com/dev-docs/topo/introduction/install/)

2. `topo clone https://github.com/Arm-Examples/cairn-perception-acorn-attack`

3. Ensure your target is ready by running `topo health --target user@my-linux-device`

4. Deploy to your target `topo deploy --target user@my-linux-device`

5. Enjoy the game! Topo will report the web url you can visit at the end of deployment.

6. Finished playing? Try a new model with: `topo configure`

## Development

Requires Node.js 22.22.3, uv and Git. Run from the repository root.

```sh
uv tool install prek==0.4.13
npm --prefix frontend ci
prek install
prek run --all-files --stage pre-commit
```

### Frontend

```sh
npm --prefix frontend run build
npm --prefix frontend test
```

Open <http://localhost:8000> after starting the backend below. Frontend, API
and WebSocket share port **8000**. Rebuild and refresh after frontend changes.

### Backend

Requires Linux/AArch64, a camera and Docker Compose.

```sh
docker compose build perception-example
docker compose up -d --wait messaging-service camera-service perception-service

uv sync --project backend --locked
uv run --directory backend --locked uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

