@echo off
chcp 65001 >nul
REM Set UTF-8 encoding for proper display
REM Execution Budget Management System Startup Batch File
title 実行予算の管理システム - Starting...

echo.
echo =====================================================
echo    実行予算の管理システム - Starting
echo =====================================================
echo.

REM 作業ディレクトリをアプリフォルダに変更
cd /d "C:\実行予算の管理"

REM 環境変数設定（ローカルネットワーク対応・強化版）
set REACT_APP_LOCAL_NETWORK=true
set HOST=0.0.0.0
set PORT=3000
set DANGEROUSLY_DISABLE_HOST_CHECK=true
set CHOKIDAR_USEPOLLING=true
set FAST_REFRESH=false
set BROWSER=none

REM Get and display local IP address
echo Checking local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

REM Set detected IP as environment variable for React app
set REACT_APP_DETECTED_IP=%LOCAL_IP%
echo Detected IP set as environment variable: %LOCAL_IP%

echo.
echo Access URL: http://%LOCAL_IP%:3000
echo.
echo Accessible from other devices on the same Wi-Fi network!
echo.
echo To stop the app, press Ctrl+C in this window.
echo.

REM Start Node.js application
echo Starting application...
echo.
echo.
echo ============================================
echo   Browser Setup Options
echo ============================================
echo.
echo Server will start at: http://%LOCAL_IP%:3000
echo.
set /p OPEN_BROWSER="Do you want to automatically open browser? (Y/N): "
if /i "%OPEN_BROWSER%"=="Y" (
    echo.
    echo Browser will open automatically after server starts...
    set AUTO_OPEN=true
) else (
    echo.
    echo Browser will NOT open automatically.
    echo Please manually open: http://%LOCAL_IP%:3000
    set AUTO_OPEN=false
)
echo.
echo Starting React development server...
echo.

if "%AUTO_OPEN%"=="true" (
    REM Start npm and auto-open browser after delay
    echo Starting server with browser auto-open...
    start /min cmd /c "timeout /t 8 /nobreak >nul && start http://%LOCAL_IP%:3000 && echo Browser opened automatically!"
)

REM Start the main npm process (this will block)
npm start

REM Exit message
echo.
echo Application has stopped.
echo Press any key to close...
pause > nul
