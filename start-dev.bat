@echo off
title NamaVest Dev Server
cd /d "%~dp0"
echo ==============================
echo   NamaVest Dev Server
echo ==============================
echo.
echo Starting Next.js development server...
echo.
npm run dev
echo.
echo Server stopped. Press any key to exit...
pause >nul
