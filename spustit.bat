@echo off
set "PORT=5062"
set "EXE_PATH=%~dp0backend\HrApp.Api\publish\HrApp.Api.exe"

echo #################################################
echo # HR APP - Spustit Publish                       #
echo #################################################
echo.

if not exist "%EXE_PATH%" (
    echo [ERROR] Soubor nebyl nalezen ve slozce publish:
    echo %EXE_PATH%
    echo.
    echo Spustil jsi uz "publish_update.bat"?
    pause
    exit /b
)

echo Spoustim backend na portu %PORT%...
echo (Oteviram aplikaci v prohlizeci na: http://localhost:%PORT%)
echo.

:: Otevrit prohlizec s malym zpozdenim
start "" "http://localhost:%PORT%"

:: Spustit EXE a rict mu, at posloucha na spravnem portu
cd "%~dp0backend\HrApp.Api\publish"
HrApp.Api.exe --urls "http://0.0.0.0:%PORT%"

pause
