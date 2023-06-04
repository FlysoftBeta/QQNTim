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

if ((Read-Host "Do you want to install QQNTim (y/n)?") -notcontains "y") {
    exit
}

Write-Output "Killing QQ processes..."
Stop-Process -Name QQ -ErrorAction SilentlyContinue

Write-Output "Copying files..."
Copy-Item ".\qqntim*.js" $QQAppLauncherDir -Force

$EntryFile = "$QQAppLauncherDir\index.js"
$EntryFileBackup = "$EntryFile.bak"
if ((Test-Path $EntryFileBackup) -eq $false) {
    Write-Output "Patching entry..."
    Copy-Item $EntryFile $EntryFileBackup -Force
    "require(`"./qqntim`");" + (Get-Content $EntryFile -Raw -Encoding UTF8) | Out-File $EntryFile -Encoding UTF8
}

Write-Output "Installed successfully."
Pause