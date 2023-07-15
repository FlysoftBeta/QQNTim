@setlocal enableextensions
@echo off
cd /d %~dp0_
color F0
mode con cols=65 lines=16

set PS_PREFIX=powershell -NoProfile -ExecutionPolicy Unrestricted

"%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system" >nul 2>nul 
if "%ERRORLEVEL%" neq "0" (
    goto try_run_as
) else (
    goto main
)
goto:eof

:try_run_as
%PS_PREFIX% -WindowStyle Hidden -Command Start-Process -Wait -FilePath """%COMSPEC%""" -Verb RunAs -ArgumentList """/c""","""`"""%~f0`""""""
goto:eof

:main
set SUCCESS_FLAG=%TEMP%\qqntim-install-successful.tmp
if exist "%SUCCESS_FLAG%" (
    del /f /q "%SUCCESS_FLAG%"
)
%PS_PREFIX% -File .\install.ps1
if not exist "%SUCCESS_FLAG%" (
    echo Installation error. If you believe this is an issue of QQNTim, please report it to us.
    pause >nul 2>nul
)
goto:eof