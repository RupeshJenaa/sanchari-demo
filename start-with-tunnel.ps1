# Start Expo with Tunnel for Android
Write-Host "Starting Expo with Tunnel..." -ForegroundColor Green

# Start Expo in background
Start-Process powershell -ArgumentList "npx expo start --lan" -WindowStyle Hidden

# Wait for Expo to start
Write-Host "Waiting for Expo to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Create tunnel
Write-Host "Creating tunnel for Android access..." -ForegroundColor Green
lt --port 8081 --print-requests

# Instructions
Write-Host "`nTo connect from Android:" -ForegroundColor Cyan
Write-Host "1. Copy the tunnel URL shown above (https://...loca.lt)" -ForegroundColor White
Write-Host "2. Open Expo Go app on your phone" -ForegroundColor White
Write-Host "3. Tap 'Enter URL manually'" -ForegroundColor White
Write-Host "4. Replace 'exp://...' with the tunnel URL" -ForegroundColor White
Write-Host "5. Keep '/index.bundle?platform=android&dev=true' at the end" -ForegroundColor White