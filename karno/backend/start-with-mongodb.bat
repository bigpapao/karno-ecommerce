@echo off
echo Starting MongoDB and Karno Backend Server

REM Set MongoDB database path
set MONGO_DATA_PATH=%USERPROFILE%\mongodb-data

REM Create MongoDB data directory if it doesn't exist
if not exist "%MONGO_DATA_PATH%" (
  echo Creating MongoDB data directory...
  mkdir "%MONGO_DATA_PATH%"
)

REM Start MongoDB
echo Starting MongoDB server...
start cmd /k "echo MongoDB server started with data path: %MONGO_DATA_PATH% & mongod --dbpath "%MONGO_DATA_PATH%""

REM Wait for MongoDB to start
echo Waiting for MongoDB to start...
timeout /t 5 /nobreak

REM Start the backend server
echo Starting Karno backend server...
set MONGO_URI=mongodb://localhost:27017/karno
set NODE_ENV=development
start cmd /k "npm run dev"

echo Both servers are now starting. Check the command windows for status.
echo Press any key to exit this window. The servers will continue running.
pause > nul 