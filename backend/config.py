import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("NEWSCARD_DATA_DIR", BASE_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.environ.get(
    "NEWSCARD_DATABASE_URL",
    f"sqlite:///{(DATA_DIR / 'newscard.db').as_posix()}",
)
FERNET_KEY_FILE = DATA_DIR / ".fernet_key"
EXPORTS_DIR = DATA_DIR / "exports"
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
HOST = os.environ.get("NEWSCARD_HOST", "127.0.0.1")
PORT = int(os.environ.get("NEWSCARD_PORT", "8000"))
