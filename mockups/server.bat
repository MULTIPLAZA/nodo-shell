@echo off
REM ====================================================
REM  ERP Lite Web - Servidor de mockups
REM  Doble click para levantar un servidor local en :8000
REM ====================================================
cd /d "%~dp0"
echo.
echo   ERP Lite Web - servidor local
echo   http://localhost:8000
echo.
echo   (Ctrl+C para detener)
echo.
start "" http://localhost:8000
npx --yes serve -p 8000 -L .
