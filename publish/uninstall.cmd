@setlocal enableextensions
@echo off
cd /d %~dp0_
chcp 65001 >nul 2>nul
title QQNTim 卸载程序
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
start "" /wait /b %PS_PREFIX% -WindowStyle Hidden -Command Start-Process -FilePath """%COMSPEC%""" -Verb RunAs -ArgumentList """/c""","""`"""%~0`""""""
goto:eof

:main
set SUCCESS_FLAG=%TEMP%\qqntim-uninstall-successful.tmp
if exist "%SUCCESS_FLAG%" (
    del /f /q "%SUCCESS_FLAG%"
)
%PS_PREFIX% -File .\uninstall.ps1
if not exist "%SUCCESS_FLAG%" (
    echo 卸载时出现错误。如果你认为这是 QQNTim 的问题，请向我们报告此问题。
    echo 你也可以尝试手动卸载。
    pause >nul 2>nul
)
goto:eof