@echo off
set "PUBLISH_DIR=%~dp0backend\HrApp.Api\publish"
set "PORT=5062"

echo #################################################
echo # HR APP - Sjednoceny spustec (v2)              #
echo #################################################
echo.

if not exist "%PUBLISH_DIR%\HrApp.Api.exe" (
    echo [ERR] Soubor %PUBLISH_DIR%\HrApp.Api.exe nebyl nalezen.
    echo Spustil jsi uz "dotnet publish"?
    pause
    exit /b
)

echo Spoustim backend na portu %PORT%...
echo (Oteviram aplikaci v prohlizeci na: http://localhost:%PORT%)
echo.

:: Otevrit prohlizec s malym zpozdenim
start "" "http://localhost:%PORT%"

:: Spustit EXE a rict mu, at posloucha na spravnem portu
cd "%PUBLISH_DIR%"
HrApp.Api.exe --urls "http://localhost:%PORT%"

pause
