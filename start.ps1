# NEWSCARD one-command launcher
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "NEWSCARD — starting..." -ForegroundColor Cyan

# Stop any old server on port 8000
$old = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $old) {
  if ($pid -and $pid -ne 0) {
    Write-Host "Stopping old process on port 8000 (PID $pid)"
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  }
}
Start-Sleep -Seconds 1

if (-not (Test-Path "frontend\dist\index.html")) {
  Write-Host "Building frontend (first time)..." -ForegroundColor Yellow
  Push-Location frontend
  npm install
  npm run build
  Pop-Location
}

$py = $null
foreach ($cmd in @("py -3.13", "py -3", "python")) {
  try {
    Invoke-Expression "$cmd --version" | Out-Null
    $py = $cmd
    break
  } catch {}
}
if (-not $py) { $py = "python" }

Write-Host ""
Write-Host "  Open:  http://127.0.0.1:8000/" -ForegroundColor Green
Write-Host "  Stop:  Ctrl+C in this window" -ForegroundColor Gray
Write-Host ""

Invoke-Expression "$py run_server.py"
