#!/usr/bin/env bash
echo "⚡ Starting PocketVerse Tech-Noir Command Center..."

# Ensure backend and frontend builds are up to date
(cd backend && npm run build)
(cd frontend && npm run build)

# Run backend API server and frontend Vite dev server concurrently with proper working directory
npx concurrently --kill-others \
  "node backend/dist/server.js" \
  "cd frontend && npx vite --host 0.0.0.0 --port 3000"
