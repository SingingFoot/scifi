#!/bin/bash
# Local preview of the site: serves the last build in _preview/ at
# http://localhost:8000 and opens it in Google Chrome.
# Build first with:  mkdocs build -d _preview
cd "$(dirname "$0")"
PORT=8000
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found — install Xcode Command Line Tools (xcode-select --install)"; read -r; exit 1
fi
lsof -ti tcp:$PORT >/dev/null 2>&1 && kill $(lsof -ti tcp:$PORT) 2>/dev/null
( sleep 1; open -a "Google Chrome" "http://localhost:$PORT/" 2>/dev/null || open "http://localhost:$PORT/" ) &
echo "Serving _preview/ at http://localhost:$PORT  (close this window to stop)"
python3 -m http.server $PORT --directory _preview
