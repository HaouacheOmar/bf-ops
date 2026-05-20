@echo off
title Lancement de BFOPS
echo===================================================
echo      Lancement de l'application BFOPS (Docker)
echo===================================================
echo.

:: Se déplacer dans le dossier du script (racine du projet)
cd /d "%~dp0"

:: Lancer docker-compose
echo Demarrage des conteneurs en cours...
docker-compose up --build

echo.
pause
