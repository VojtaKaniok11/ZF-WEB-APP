# HR App - Integrated Publish Script (to Backend Subfolder)
$TargetDir = "backend\HrApp.Api\publish"

Write-Host "--- PUBLISH UPDATE STARTED ---" -ForegroundColor Cyan

# 1. Clear old build artifacts
if (Test-Path "out") { Remove-Item -Path "out" -Recurse -Force }
if (Test-Path $TargetDir) { Remove-Item -Path $TargetDir -Recurse -Force }

# 2. Build Next.js
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

# 3. Synchronize wwwroot
Write-Host "Syncing to backend wwwroot..." -ForegroundColor Yellow
if (!(Test-Path "backend\HrApp.Api\wwwroot")) { New-Item -ItemType Directory -Path "backend\HrApp.Api\wwwroot" }
robocopy out\ backend\HrApp.Api\wwwroot /MIR /NJH /NJS

# 4. Dotnet publish to the specific target directory
Write-Host "Publishing to $TargetDir..." -ForegroundColor Yellow
dotnet publish backend\HrApp.Api\HrApp.Api.csproj -c Release -o $TargetDir

# 5. Create launch batch file in publish directory
Write-Host "Creating launch scripts in publish directory..." -ForegroundColor Yellow
$LaunchScript = "$TargetDir\spustit.bat"
"@echo off
start """" `"http://localhost:5062`"
HrApp.Api.exe --urls `"http://0.0.0.0:5062`"" | Out-File -FilePath $LaunchScript -Encoding ASCII

$StartScript = "$TargetDir\start.bat"
"HrApp.Api.exe --urls `"http://0.0.0.0:5062`"" | Out-File -FilePath $StartScript -Encoding ASCII

Write-Host "--- PUBLISH COMPLETE ---" -ForegroundColor Green
Write-Host "Your app is ready in: $(Resolve-Path $TargetDir)"
