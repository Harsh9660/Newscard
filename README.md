# NEWSCARD v2.1

Desktop-style business management for newsagents. Combines:

- **FastAPI + SQLite** — portable single-file database, zero server setup
- **Fernet encryption** — customer address & phone encrypted at rest
- **APScheduler** — nightly JSON export at 22:00 to `data/exports/YYYY/MM/DD/`
- **React + Tailwind** — dark terminal UI with universal bottom action bar
- **Help system** — F1 on every screen (Overview, How To, Shortcuts, FAQ)
- **PyInstaller** — optional single-folder `.exe` build

## Quick start (development)

```bash
cd C:\Users\hp\Projects\newscard
py -m pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..
py run_server.py
```

Or double-click `run.bat` (opens browser at http://127.0.0.1:8000).

### Dev mode (hot reload frontend)

Terminal 1:
```bash
py -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:
```bash
cd frontend && npm run dev
```

Open http://localhost:5173 (API proxied to :8000).

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| F1 | Help |
| F5 | Refresh |
| F10 | Save snapshot |
| Ctrl+Shift+X | Extract Excel |
| Ctrl+1..4 | Navigate |
| Ctrl+N / O / Delete | CRUD on lists |
| Ctrl+Shift+X | Export PDF/CSV/Excel |

## Build executable

```bash
py build_app.py
```

Output: `dist/NEWSCARD/` with `NEWSCARD.exe` and `run.bat`.

## Environment

| Variable | Default |
|----------|---------|
| `NEWSCARD_DATABASE_URL` | `sqlite:///.../data/newscard.db` |
| `NEWSCARD_DATA_DIR` | `./data` |
| `NEWSCARD_HOST` | `127.0.0.1` |
| `NEWSCARD_PORT` | `8000` |
