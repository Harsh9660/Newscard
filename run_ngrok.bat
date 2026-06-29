@echo off
cd /d "%~dp0"
title NEWSCARD + ngrok

if not exist "frontend\dist\index.html" (
  echo Building frontend...
  cd frontend
  call npm install
  call npm run build
  cd ..
)

echo.
echo ============================================================
echo  NEWSCARD ngrok setup
echo ============================================================
echo.
echo  STEP 1 - One-time only: get a free token from
echo           https://dashboard.ngrok.com/get-started/your-authtoken
echo.
echo  STEP 2 - In a terminal run:
echo           ngrok config add-authtoken YOUR_TOKEN_HERE
echo.
echo  STEP 3 - Run this file again
echo ============================================================
echo.

where ngrok >nul 2>&1
if errorlevel 1 (
  echo ngrok not found. Install: winget install Ngrok.Ngrok
  pause
  exit /b 1
)

ngrok config check >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERROR: ngrok is not configured yet.
  echo Run: ngrok config add-authtoken YOUR_TOKEN
  echo Get token: https://dashboard.ngrok.com/get-started/your-authtoken
  echo.
  pause
  exit /b 1
)

echo Updating ngrok if needed...
ngrok update >nul 2>&1

set NEWSCARD_HOST=0.0.0.0
echo Starting NEWSCARD server on port 8000...
start "NEWSCARD Server" cmd /k "cd /d %~dp0 && set NEWSCARD_HOST=0.0.0.0 && py -3.13 run_server.py"

timeout /t 3 /nobreak >nul

echo Starting ngrok tunnel...
echo.
echo When ngrok shows "Forwarding https://...." copy that URL for your friend.
echo Press Ctrl+C here to stop ngrok (server window stays open until you close it).
echo.

ngrok http 8000

pause
