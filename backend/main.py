import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from starlette.staticfiles import StaticFiles

from backend.config import BASE_DIR, HOST, PORT
from backend.database import Base, engine
from backend.scheduler import shutdown_scheduler, start_scheduler
from backend.routers import billing, customers, dashboard, delivery_rounds, export, products

FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
INDEX_HTML = FRONTEND_DIST / "index.html"

MISSING_FRONTEND_HTML = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>NEWSCARD — Setup Required</title>
<style>body{font-family:Consolas,monospace;background:#0d1117;color:#e6edf3;padding:2rem;max-width:640px;margin:auto}
h1{color:#e94560}code{background:#1e1e2e;padding:2px 6px;border-radius:4px}a{color:#22d3ee}</style></head>
<body>
<h1>NEWSCARD — Frontend not built</h1>
<p>The API is running, but the UI files are missing. In PowerShell:</p>
<pre>cd frontend
npm install
npm run build</pre>
<p>Then restart: <code>py -3.13 run_server.py</code></p>
<p><a href="/api/health">Check API health</a></p>
</body></html>"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    if INDEX_HTML.is_file():
        print(f"[NEWSCARD] UI ready at http://{HOST}:{PORT}/")
        print(f"[NEWSCARD] Frontend files: {FRONTEND_DIST}")
    else:
        print(f"[NEWSCARD] WARNING: Build frontend first:")
        print("  cd frontend && npm install && npm run build")
    yield
    shutdown_scheduler()


app = FastAPI(title="NEWSCARD", version="2.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router)
app.include_router(products.router)
app.include_router(delivery_rounds.router)
app.include_router(export.router)
app.include_router(dashboard.router)
app.include_router(billing.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": "NEWSCARD",
        "frontend_built": INDEX_HTML.is_file(),
        "url": f"http://{HOST}:{PORT}/",
    }


# API routes registered above take priority over the static mount below.
if INDEX_HTML.is_file():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIST), html=True),
        name="frontend",
    )
else:

    @app.get("/")
    async def missing_frontend():
        return HTMLResponse(MISSING_FRONTEND_HTML)


def run():
    import uvicorn

    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=False)


if __name__ == "__main__":
    run()
