@echo off
cd /d "%~dp0"
echo NEWSCARD startup...

if not exist "frontend\dist\index.html" (
  echo.
  echo Frontend not built yet. Building...
  cd frontend
  call npm install
  if errorlevel 1 goto :fail
  call npm run build
  if errorlevel 1 goto :fail
  cd ..
  echo.
)

echo Starting server...
start "" /B cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:8000"
py -3.13 run_server.py 2>nul
if errorlevel 1 py run_server.py
if errorlevel 1 python run_server.py
goto :end

:fail
echo Build failed. Install Node.js from https://nodejs.org then run this again.
pause
exit /b 1

:end
pause
