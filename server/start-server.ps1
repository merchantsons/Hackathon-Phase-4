# PowerShell script to start the chat server
Write-Host "Starting Chat Server..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "Please create server/.env with:" -ForegroundColor Yellow
    Write-Host "  OPENAI_API_KEY=your_key_here"
    Write-Host "  BACKEND_API_URL=http://localhost:8000"
    Write-Host "  PORT=3001"
    Write-Host ""
}

Write-Host "Starting server on port 3001..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
