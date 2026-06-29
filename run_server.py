"""Launch NEWSCARD API and open browser after server is ready."""
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.config import HOST, PORT
from backend.main import INDEX_HTML, run

URL = f"http://{HOST}:{PORT}"


def _wait_and_open_browser():
    for _ in range(30):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen(f"{URL}/api/health", timeout=1) as r:
                if r.status == 200:
                    webbrowser.open(URL)
                    return
        except Exception:
            pass
    print(f"Open manually: {URL}")


if __name__ == "__main__":
    if not INDEX_HTML.is_file():
        print("WARNING: frontend/dist not found. Run: cd frontend && npm run build")
    print(f"Starting NEWSCARD at {URL}")
    print("Press Ctrl+C to stop.")
    threading.Thread(target=_wait_and_open_browser, daemon=True).start()
    run()
