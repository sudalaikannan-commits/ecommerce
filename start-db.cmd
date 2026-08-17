@echo off
title NovaCart Database Dashboard
cd /d "%~dp0"
echo Starting Prisma Studio at http://localhost:5555
call npx prisma studio
pause
