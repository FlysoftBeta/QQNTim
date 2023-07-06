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

foreach ($RegistryPath in @("HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*", "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*")) {
    foreach ($Item in (Get-ItemProperty $RegistryPath)) {
        if ($Item.PSChildName -eq "QQ") {
            $QQInstallDir = (Split-Path -Parent $Item.UninstallString)
            break
        }
    }
}

if (($null -eq $QQInstallDir) -or ((Test-Path $QQInstallDir) -eq $false)) {
    throw "QQNT installation not found."
}
$QQAppDir = "$QQInstallDir\resources\app"
$QQAppLauncherDir = "$QQAppDir\app_launcher"
$EntryFile = "$QQAppLauncherDir\index.js"
$EntryBackupFile = "$EntryFile.bak"
$PackageJSONFile = "$QQAppDir\package.json"
$QQNTimFlagFile = "$QQAppLauncherDir\qqntim-flag.txt"

if ((Test-Path $EntryBackupFile) -eq $true) {
    Write-Output "Cleaning up old installation..."
    Move-Item $EntryBackupFile $EntryFile -Force
    "" | Out-File $QQNTimFlagFile -Encoding UTF8 -Force
}

if ((Test-Path $QQNTimFlagFile) -eq $false) {
    if ((Read-Host "Do you want to install QQNTim (y/n)?") -notcontains "y") {
        exit -1
    }
    "" | Out-File $QQNTimFlagFile -Encoding UTF8 -Force
}

Write-Output "Killing QQ processes..."
Stop-Process -Name QQ -ErrorAction SilentlyContinue

Write-Output "Copying files..."
Copy-Item ".\qqntim.js", ".\qqntim-renderer.js" $QQAppLauncherDir -Force
Copy-Item ".\node_modules" $QQAppLauncherDir -Recurse -Force

Write-Output "Patching package.json..."
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines($PackageJSONFile, ((Get-Content $PackageJSONFile -Raw -Encoding UTF8 -Force) -replace "./app_launcher/index.js", "./app_launcher/qqntim.js"), $Utf8NoBomEncoding)

Write-Output "Installed successfully. Installer will exit in 5 sec."
Start-Sleep 5
