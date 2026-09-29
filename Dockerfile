# syntax=docker/dockerfile:1@sha256:ecfaec9ed6d810b56388c508f4121597bfbba70d41a6dfeee4d8cad5f295fc32
ARG UV_IMAGE=ghcr.io/astral-sh/uv:trixie-slim@sha256:95611d89b7324e0517fe7257bb00979cf1f68461e5fb2b2d027d039da054bc07
ARG NODE_IMAGE=node:22-alpine@sha256:b6f26b36c8ff49624cfdac716b8ea1138d606df02586a77d364bb5536a634f85

FROM ${NODE_IMAGE} AS frontend

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/index.html ./
COPY frontend/public ./public
COPY frontend/src ./src
RUN npm ci && npm run build
RUN chmod -R a+rX /app/frontend/dist

FROM ${UV_IMAGE} AS builder

ARG OPK_HF_DETECTION_MODEL=Arm/ultraface-rfb-320-onnx-raspberry
ENV UV_PYTHON_INSTALL_DIR=/opt/uv/python
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY scripts/download-model.sh /usr/local/bin/download-model.sh
RUN OPK_HF_DETECTION_MODEL="${OPK_HF_DETECTION_MODEL}" \
    sh /usr/local/bin/download-model.sh

WORKDIR /app/backend

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

FROM ${UV_IMAGE} AS runtime

ARG DETECTION_LABEL=""
ENV DETECTION_LABEL=${DETECTION_LABEL}

WORKDIR /app/backend

COPY --from=builder /app/backend/.venv /app/backend/.venv
COPY --from=builder /opt/uv/python /opt/uv/python
COPY --from=frontend /app/frontend/dist /app/frontend/dist
COPY backend/detection.py backend/labels.py backend/main.py backend/settings.py ./
COPY --from=builder /models/ /models/
RUN useradd --create-home --uid 10001 app

USER app

CMD ["uv", "run", "uvicorn", "main:app", "--host=0.0.0.0", "--port=8000"]
