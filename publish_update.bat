@echo off
echo =================================================
echo [   HR APP   ] --- PUBLISH UPDATE (BACKEND DIR) ---
echo =================================================

:: Step 1: Clean frontend out
if exist "out\" rd /s /q "out\"

:: Step 2: Build frontend
echo 1. Building frontend (Next.js)...
call npm run build

:: Step 3: Copy to backend wwwroot (for source)
echo 2. Syncing assets to backend wwwroot...
if not exist "backend\HrApp.Api\wwwroot" mkdir "backend\HrApp.Api\wwwroot"
robocopy out\ backend\HrApp.Api\wwwroot /MIR /NJH /NJS

:: Step 3.5: Clean old backend publish folder
echo 2.5. Cleaning old backend publish folder...
if exist "backend\HrApp.Api\publish\" rd /s /q "backend\HrApp.Api\publish\"

:: Step 4: Publish to SPECIFIC folder requested by user
echo 3. Publishing backend to backend\HrApp.Api\publish...
call dotnet publish backend\HrApp.Api\HrApp.Api.csproj -c Release -o backend\HrApp.Api\publish

:: Step 5: Create launchers in publish folder
echo 4. Creating launchers in publish folder...
echo HrApp.Api.exe --urls "http://0.0.0.0:5062" > "backend\HrApp.Api\publish\start.bat"
echo @echo off > "backend\HrApp.Api\publish\spustit.bat"
echo start "" "http://localhost:5062" >> "backend\HrApp.Api\publish\spustit.bat"
echo HrApp.Api.exe --urls "http://0.0.0.0:5062" >> "backend\HrApp.Api\publish\spustit.bat"

echo.
echo =================================================
echo [   HR APP   ] --- UPDATE COMPLETE!          ---
echo =================================================
echo Location: backend\HrApp.Api\publish
echo.
pause
