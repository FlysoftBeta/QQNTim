$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)

# Self-elevate the script if required
if (-Not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    if ([int](Get-CimInstance -Class Win32_OperatingSystem | Select-Object -ExpandProperty BuildNumber) -ge 6000) {
        $Command = "-File `"" + $MyInvocation.MyCommand.Path + "`" " + $MyInvocation.UnboundArguments
        Start-Process -FilePath powershell -Verb RunAs -ArgumentList $Command
        exit
    }
}

if ([Environment]::Is64BitOperatingSystem) {
    $QQInstallDir = "${env:ProgramFiles(x86)}\Tencent\QQNT"
}
else {
    $QQInstallDir = "${env:ProgramFiles}\Tencent\QQNT"
}
if ((Test-Path $QQInstallDir) -eq $false) {
    throw "QQNT installation not found."
}
$QQAppLauncherDir = "$QQInstallDir\resources\app\app_launcher"

$EntryFile = "$QQAppLauncherDir\index.js"
$EntryFileBackup = "$EntryFile.bak"
if ((Test-Path $EntryFileBackup) -eq $false) {
    throw "QQNTim not installed."
}

if ((Read-Host "Do you want to uninstall QQNTim (y/n)?") -notcontains "y") {
    exit
}

if ((Read-Host "Also remove your data (y/n)?") -contains "y") {
    Remove-Item "${env:UserProfile}\.qqntim" -Recurse -Force
}

Write-Output "Killing QQ processes..."
Stop-Process -Name QQ -ErrorAction SilentlyContinue

Write-Output "Removing files..."
Remove-Item "$QQAppLauncherDir\qqntim*.js" -Force

Write-Output "Restoring entry..."
Move-Item $EntryFileBackup $EntryFile -Force

Write-Output "Uninstalled successfully."
Pause