# This script needs to be run as Administrator
# It will add firewall rules for Expo to work on your phone

Write-Host "Adding Firewall Rules for Expo..." -ForegroundColor Green

# Add rules for Metro Bundler (port 8081)
New-NetFirewallRule -DisplayName "Expo Metro Bundler" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Any -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Expo Metro Bundler" -Direction Outbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Any -ErrorAction SilentlyContinue

# Add rules for Expo Dev Server (port 19000-19006)
New-NetFirewallRule -DisplayName "Expo Dev Server" -Direction Inbound -Protocol TCP -LocalPort 19000-19006 -Action Allow -Profile Any -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Expo Dev Server" -Direction Outbound -Protocol TCP -LocalPort 19000-19006 -Action Allow -Profile Any -ErrorAction SilentlyContinue

Write-Host "Firewall rules added successfully!" -ForegroundColor Green
Write-Host "Please restart your Expo server now." -ForegroundColor Yellow