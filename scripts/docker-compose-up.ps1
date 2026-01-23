# Docker Compose startup script
# This script loads environment variables from backend/.env and runs docker compose

$ErrorActionPreference = "Stop"

Write-Host "Loading environment variables from backend/.env..." -ForegroundColor Cyan

# Get the project root directory (parent of scripts directory)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendEnvFile = Join-Path $ProjectRoot "backend\.env"

if (-not (Test-Path $BackendEnvFile)) {
    Write-Host "ERROR: backend/.env file not found at $BackendEnvFile" -ForegroundColor Red
    exit 1
}

# Read and parse .env file
$envVars = @{}
Get-Content $BackendEnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# Set environment variables
if ($envVars.ContainsKey("DATABASE_URL")) {
    $env:DATABASE_URL = $envVars["DATABASE_URL"]
    Write-Host "  DATABASE_URL: Set" -ForegroundColor Green
} else {
    Write-Host "  WARNING: DATABASE_URL not found in .env file" -ForegroundColor Yellow
}

if ($envVars.ContainsKey("BETTER_AUTH_SECRET")) {
    $env:BETTER_AUTH_SECRET = $envVars["BETTER_AUTH_SECRET"]
    Write-Host "  BETTER_AUTH_SECRET: Set" -ForegroundColor Green
} else {
    Write-Host "  WARNING: BETTER_AUTH_SECRET not found in .env file" -ForegroundColor Yellow
}

if ($envVars.ContainsKey("CORS_ORIGINS")) {
    $env:CORS_ORIGINS = $envVars["CORS_ORIGINS"]
    Write-Host "  CORS_ORIGINS: Set" -ForegroundColor Green
} else {
    Write-Host "  WARNING: CORS_ORIGINS not found in .env file" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Docker Compose..." -ForegroundColor Cyan
Write-Host ""

# Change to project root directory (where docker-compose.yml is located)
Set-Location $ProjectRoot

# Run docker compose with any passed arguments
docker compose up @args
