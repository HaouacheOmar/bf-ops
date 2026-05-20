@echo off
echo Starting BFOPS Docker containers...
docker-compose up -d

echo Waiting for containers to initialize (5 seconds)...
timeout /t 5 /nobreak > NUL

echo Opening browser...
start http://localhost:5173

echo Done! BFOPS is running in the background.
echo You can safely close this window.
pause
