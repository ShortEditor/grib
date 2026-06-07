@echo off
title GRIB — Starting...
color 0A

echo.
echo  ██████╗ ██████╗ ██╗██████╗ 
echo  ██╔════╝ ██╔══██╗██║██╔══██╗
echo  ██║  ███╗██████╔╝██║██████╔╝
echo  ██║   ██║██╔══██╗██║██╔══██╗
echo  ╚██████╔╝██║  ██║██║██████╔╝
echo   ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝ 
echo.
echo  Your brain, dumped. Your AI, trained on you.
echo  -----------------------------------------------
echo.

echo [1/2] Starting backend server...
start "GRIB Backend" cmd /k "cd /d D:\Grib\server && npm run dev"

echo [2/2] Starting frontend...
timeout /t 2 /nobreak >nul
start "GRIB Frontend" cmd /k "cd /d D:\Grib\client && npm run dev"

echo [3/3] Opening browser...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo  GRIB is running!
echo  Frontend : http://localhost:5173
echo  Backend  : http://localhost:5000
echo.
echo  Close the two server windows to shut down GRIB.
echo.
pause
