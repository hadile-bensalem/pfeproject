@echo off
echo ===================================================
echo  Dindor AI - Service de Prediction de Prix
echo  Port : 8001
echo ===================================================

REM Creer l'environnement virtuel si absent
if not exist ".venv" (
    echo Creation de l'environnement virtuel Python...
    python -m venv .venv
)

REM Activer l'environnement
call .venv\Scripts\activate.bat

REM Installer/mettre a jour les dependances seulement si requirements.txt a change
set REQ_HASH_FILE=.venv\.req_installed
set REQ_FILE=requirements.txt

REM Comparer le hash de requirements.txt avec celui enregistre
for /f "skip=1 delims=" %%h in ('certutil -hashfile "%REQ_FILE%" SHA1 2^>nul') do (
    if "%%h" neq "" (
        set CURRENT_HASH=%%h
        goto :hash_done
    )
)
:hash_done

set NEEDS_INSTALL=1
if exist "%REQ_HASH_FILE%" (
    set /p SAVED_HASH=<"%REQ_HASH_FILE%"
    if "%CURRENT_HASH%"=="%SAVED_HASH%" (
        set NEEDS_INSTALL=0
    )
)

if "%NEEDS_INSTALL%"=="1" (
    echo Installation des dependances...
    pip install -r requirements.txt --quiet
    echo %CURRENT_HASH%>"%REQ_HASH_FILE%"
    echo Dependances installees.
) else (
    echo Dependances deja a jour.
)

REM Lancer le service FastAPI
echo.
echo Demarrage du service IA sur http://localhost:8001
echo Documentation API : http://localhost:8001/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
