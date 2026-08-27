# Netily Frontend Quick Start Script
# Run this in PowerShell to start the Next.js development server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Netily ISP - Frontend Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path ".\node_modules")) {
    Write-Host "[!] node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[+] Dependencies already installed" -ForegroundColor Green
}

# Check if .env.local exists
if (-not (Test-Path ".\.env.local")) {
    Write-Host "[!] .env.local not found. Creating default..." -ForegroundColor Yellow
    @"
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
"@ | Out-File -FilePath ".\.env.local" -Encoding UTF8
    Write-Host "[+] Created .env.local with default values" -ForegroundColor Green
}

# Start the server
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Next.js Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Test Tenant URLs:" -ForegroundColor Yellow
Write-Host "  - http://yellow1.localhost:3000 (for yellow1 tenant)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
