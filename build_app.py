"""
Build NEWSCARD as a single-folder executable with PyInstaller.
Run from project root: python build_app.py
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"


def run(cmd, cwd=None):
    print(">", " ".join(cmd))
    subprocess.check_call(cmd, cwd=cwd or ROOT)


def main():
    if not (FRONTEND / "package.json").exists():
        print("Frontend not found")
        sys.exit(1)

    print("=== Installing Python dependencies ===")
    run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    run([sys.executable, "-m", "pip", "install", "pyinstaller"])

    print("=== Building React frontend ===")
    run(["npm", "install"], cwd=FRONTEND)
    run(["npm", "run", "build"], cwd=FRONTEND)

    if not DIST.exists():
        print("Frontend build failed — dist/ missing")
        sys.exit(1)

    print("=== PyInstaller ===")
    run(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "--name",
            "NEWSCARD",
            "--onedir",
            "--noconfirm",
            "--clean",
            "--add-data",
            f"{DIST}{';' if sys.platform == 'win32' else ':'}frontend/dist",
            "--hidden-import",
            "uvicorn.logging",
            "--hidden-import",
            "uvicorn.loops",
            "--hidden-import",
            "uvicorn.loops.auto",
            "--hidden-import",
            "uvicorn.protocols",
            "--hidden-import",
            "uvicorn.protocols.http",
            "--hidden-import",
            "uvicorn.protocols.http.auto",
            "--hidden-import",
            "uvicorn.protocols.websockets",
            "--hidden-import",
            "uvicorn.protocols.websockets.auto",
            "--hidden-import",
            "uvicorn.lifespan",
            "--hidden-import",
            "uvicorn.lifespan.on",
            "run_server.py",
        ]
    )

    out = ROOT / "dist" / "NEWSCARD"
    bat = out / "run.bat"
    bat.write_text(
        """@echo off
cd /d "%~dp0"
start "" "http://127.0.0.1:8000"
NEWSCARD.exe
""",
        encoding="utf-8",
    )
    print(f"\n✅ Build complete: {out}")
    print(f"   Run: {bat}")


if __name__ == "__main__":
    main()
