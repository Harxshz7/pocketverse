#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi

  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
}

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    exit 1
  fi
}

port_is_free() {
  local host="$1"
  local port="$2"

  "${PYTHON_COMMAND}" - "$port" 2>/dev/null <<'PY'
import socket
import sys

port = int(sys.argv[1])

try:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(('', port))
except OSError:
    sys.exit(1)
sys.exit(0)
PY

  case "$?" in
    0) return 0 ;;
    1) return 1 ;;
    *)
      echo "Port probe was not permitted; trying requested port ${port}." >&2
      return 0
      ;;
  esac
}

find_free_port() {
  local host="$1"
  local preferred_port="$2"
  local port="$preferred_port"
  local max_port=$((preferred_port + 50))

  while (( port <= max_port )); do
    if port_is_free "$host" "$port"; then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
  done

  echo "No free port found from ${preferred_port} to ${max_port} on ${host}" >&2
  exit 1
}

trap cleanup EXIT INT TERM

require_command npm

if [[ ! -d "${ROOT_DIR}/frontend/node_modules" ]]; then
  echo "Frontend dependencies are missing. Run: cd frontend && npm install" >&2
  exit 1
fi

if [[ -x "${ROOT_DIR}/backend/venv/bin/python" ]]; then
  PYTHON_COMMAND="${ROOT_DIR}/backend/venv/bin/python"
else
  require_command python3
  PYTHON_COMMAND="python3"
fi

BACKEND_BIND_HOST="${BACKEND_HOST}"
FRONTEND_BIND_HOST="${FRONTEND_HOST}"

BACKEND_PORT_SELECTED="$(find_free_port "${BACKEND_BIND_HOST}" "${BACKEND_PORT}")"
FRONTEND_PORT_SELECTED="$(find_free_port "${FRONTEND_BIND_HOST}" "${FRONTEND_PORT}")"

if [[ "${BACKEND_PORT_SELECTED}" != "${BACKEND_PORT}" ]]; then
  echo "Backend port ${BACKEND_PORT} is in use; using ${BACKEND_PORT_SELECTED}."
fi

if [[ "${FRONTEND_PORT_SELECTED}" != "${FRONTEND_PORT}" ]]; then
  echo "Frontend port ${FRONTEND_PORT} is in use; using ${FRONTEND_PORT_SELECTED}."
fi

BACKEND_PORT="${BACKEND_PORT_SELECTED}"
FRONTEND_PORT="${FRONTEND_PORT_SELECTED}"
API_PROXY_TARGET="http://127.0.0.1:${BACKEND_PORT}"

if [[ -x "${ROOT_DIR}/backend/venv/bin/uvicorn" ]]; then
  BACKEND_COMMAND=("${ROOT_DIR}/backend/venv/bin/uvicorn")
else
  BACKEND_COMMAND=("${PYTHON_COMMAND}" -m uvicorn)
fi

echo "Starting StoryGuard backend on http://${BACKEND_HOST}:${BACKEND_PORT}"
(
  cd "${ROOT_DIR}/backend"
  "${BACKEND_COMMAND[@]}" app.main:app --reload --host "${BACKEND_HOST}" --port "${BACKEND_PORT}"
) &
BACKEND_PID="$!"

sleep 2
if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
  echo "Backend failed to start. Fix the backend error above and run ./start.sh again." >&2
  exit 1
fi

echo "Starting StoryGuard frontend on http://${FRONTEND_HOST}:${FRONTEND_PORT}"
(
  cd "${ROOT_DIR}/frontend"
  VITE_API_PROXY_TARGET="${API_PROXY_TARGET}" npm run dev -- --host "${FRONTEND_HOST}" --port "${FRONTEND_PORT}" --strictPort
) &
FRONTEND_PID="$!"

sleep 2
if ! kill -0 "${FRONTEND_PID}" 2>/dev/null; then
  echo "Frontend failed to start. Fix the frontend error above and run ./start.sh again." >&2
  exit 1
fi

echo "StoryGuard is starting."
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo "Backend:  ${API_PROXY_TARGET}"
echo "Press Ctrl+C to stop both services."

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
