@echo off
title NovaCart Server
cd /d "%~dp0"
echo Starting NovaCart at http://localhost:3000
call npm start
pause
