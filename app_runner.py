"""Desktop Standalone Entrypoint for CloakBrowser Manager (Windows x64 / macOS / Linux).

Runs Uvicorn and FastAPI in-process and opens the default browser.
"""

from __future__ import annotations

import os
import sys
import time
import socket
import threading
import webbrowser
import urllib.request
from pathlib import Path

# Ensure root is in sys.path
if getattr(sys, "frozen", False):
    ROOT = Path(sys._MEIPASS)
else:
    ROOT = Path(__file__).resolve().parent

sys.path.insert(0, str(ROOT))

import uvicorn
from backend.main import app

SERVER_URL = "http://127.0.0.1:8080"


def _ensure_server_port_available(port: int = 8080) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def _open_browser_when_ready():
    for _ in range(50):
        try:
            with urllib.request.urlopen(f"{SERVER_URL}/api/status", timeout=0.5):
                print(f"[ready] Opening CloakBrowser Manager at {SERVER_URL}")
                webbrowser.open(SERVER_URL)
                return
        except OSError:
            time.sleep(0.2)
    print(f"[warning] Server did not respond within timeout, please open {SERVER_URL} manually.")


def main():
    print("=" * 60)
    print("  CloakBrowser Manager — Standalone Anti-Detect Suite (x64)")
    print(f"  Starting Dashboard at: {SERVER_URL}")
    print("=" * 60)

    if not _ensure_server_port_available(8080):
        print(f"[warning] Port 8080 is already in use. Trying to connect existing or start...")

    # Start browser opener in background thread
    threading.Thread(target=_open_browser_when_ready, daemon=True).start()

    # Set native runtime mode
    os.environ["CLOAKBROWSER_MANAGER_RUNTIME"] = "native"

    # Start Uvicorn ASGI Server
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8080,
        log_level="info",
        access_log=False,
    )


if __name__ == "__main__":
    main()
