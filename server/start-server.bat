@echo off
echo Starting Chat Server...
echo.
echo Make sure you have:
echo 1. Set OPENAI_API_KEY in server/.env
echo 2. Backend is running on port 8000
echo.
cd /d "%~dp0"
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)
echo Starting server on port 3001...
echo.
call npm run dev
pause
