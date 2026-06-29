@echo off
cd /d "%~dp0"
echo NEWSCARD — LAN mode (others on your Wi-Fi can connect)
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set IP=%%a
  goto :found
)
:found
set IP=%IP: =%

set NEWSCARD_HOST=0.0.0.0
echo Your PC will listen on all network interfaces.
echo.
echo Share this URL with people on the SAME Wi-Fi / network:
echo   http://%IP%:8000/
echo.
echo WARNING: No login on this app — only use on trusted networks.
echo Press Ctrl+C to stop the server.
echo.

if not exist "frontend\dist\index.html" (
  echo Building frontend first...
  cd frontend
  call npm install
  call npm run build
  cd ..
)

py -3.13 run_server.py 2>nul
if errorlevel 1 py run_server.py
pause
