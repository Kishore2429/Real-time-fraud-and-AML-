@echo off
setlocal
echo ============================================
echo SYNESIS 26 - Fraud and AML Risk Prototype
echo ============================================
where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher "py" not found. Install Python 3.10+ from python.org and enable Add Python to PATH.
  pause
  exit /b 1
)
if not exist .venv (
  echo Creating virtual environment...
  py -m venv .venv
  if errorlevel 1 goto error
)
echo Installing requirements...
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto error
if not exist .env copy .env.example .env >nul
echo Seeding demo data...
.venv\Scripts\python.exe -m app.seed
if errorlevel 1 goto error
echo Starting server at http://127.0.0.1:8000
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
goto end
:error
echo.
echo Setup failed. Check that Python is installed and internet is available, then retry.
pause
exit /b 1
:end
endlocal
