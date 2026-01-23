# Phase IV - Windows Kubernetes Prereq Installer
# Generated from: specs/deployment/minikube.md

$ErrorActionPreference = "Stop"

Write-Host "== Phase IV: Installing prerequisites (Windows) ==" -ForegroundColor Cyan

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  Write-Host "❌ winget not found. Install 'App Installer' from Microsoft Store, then retry." -ForegroundColor Red
  exit 1
}

Write-Host "Installing Minikube (winget)..." -ForegroundColor Cyan
winget install -e --id Kubernetes.minikube --accept-source-agreements --accept-package-agreements

Write-Host "Installing Helm (winget)..." -ForegroundColor Cyan
winget install -e --id Helm.Helm --accept-source-agreements --accept-package-agreements

Write-Host ""
Write-Host "== Verify tools ==" -ForegroundColor Cyan
try { kubectl version --client | Out-Host } catch { Write-Host "⚠️ kubectl not found (install if needed): winget install -e --id Kubernetes.kubectl" -ForegroundColor Yellow }
try { minikube version | Out-Host } catch { Write-Host "❌ minikube not available on PATH. Reopen PowerShell and retry." -ForegroundColor Red; exit 1 }
try { helm version | Out-Host } catch { Write-Host "❌ helm not available on PATH. Reopen PowerShell and retry." -ForegroundColor Red; exit 1 }
try { docker version | Out-Host } catch { Write-Host "⚠️ docker CLI/daemon not available. Install + start Docker Desktop." -ForegroundColor Yellow }

Write-Host ""
Write-Host "Next:" -ForegroundColor Green
Write-Host "1) Start Docker Desktop and wait until Engine is running." -ForegroundColor Green
Write-Host "2) Run: minikube start --profile=todo-hackathon --cpus=4 --memory=8192 --disk-size=20g --driver=docker" -ForegroundColor Green
Write-Host "3) Deploy: .\\scripts\\deploy-minikube.ps1" -ForegroundColor Green

