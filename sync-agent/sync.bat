@echo off
rem SAUMEK Sync Agent - Sinkronisasi WO SIMIP -> Supabase
rem Jalankan dari PC di dalam jaringan Sulfindo (kantor/VPN).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0saumek-sync.ps1" %*
echo.
pause
