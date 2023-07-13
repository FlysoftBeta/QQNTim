$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "QQNTim 卸载程序 (PowerShell)"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)

if (-Not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    if ([int](Get-CimInstance -Class Win32_OperatingSystem | Select-Object -ExpandProperty BuildNumber) -ge 6000) {
        throw "权限不足。" 
    }
}

foreach ($RegistryPath in @("HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*", "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*")) {
    try {
        foreach ($Item in (Get-ItemProperty $RegistryPath)) {
            if ($Item.PSChildName -eq "QQ") {
                $QQInstallDir = (Split-Path -Parent $Item.UninstallString)
                break
            }
        }
    }
    catch {}
}

if (($null -eq $QQInstallDir) -or ((Test-Path $QQInstallDir) -eq $false)) {
    throw "未找到 QQNT 安装目录。"
}
$QQAppDir = "$QQInstallDir\resources\app"
$QQAppLauncherDir = "$QQAppDir\app_launcher"
$EntryFile = "$QQAppLauncherDir\index.js"
$EntryBackupFile = "$EntryFile.bak"
$PackageJSONFile = "$QQAppDir\package.json"
$QQNTimFlagFile = "$QQAppLauncherDir\qqntim-flag.txt"
$SuccessFlagFile = "$env:TEMP\qqntim-uninstall-successful.tmp"

if ((Test-Path $EntryBackupFile) -eq $true) {
    Write-Output "正在清理旧版 QQNTim……"
    Move-Item $EntryBackupFile $EntryFile -Force
    "" | Out-File $QQNTimFlagFile -Encoding UTF8 -Force
}

if ((Test-Path $QQNTimFlagFile) -eq $false) {
    throw "QQNTim 未被安装。"
}

if ((Read-Host "是否要卸载 QQNTim (y/n)？") -notcontains "y") {
    throw "卸载已被用户取消。"
}

if ((Read-Host "是否需要同时移除所有数据 (y/n)？") -contains "y") {
    Remove-Item "${env:UserProfile}\.qqntim" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output "正在关闭 QQ……"
Stop-Process -Name QQ -ErrorAction SilentlyContinue

Write-Output "正在移除文件……"
Remove-Item "$QQAppLauncherDir\qqntim.js", "$QQAppLauncherDir\qqntim-renderer.js" -Force
Remove-Item "$QQAppLauncherDir\node_modules", "$QQAppLauncherDir\builtins" -Recurse -Force

Write-Output "正在还原 package.json……"
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines($PackageJSONFile, ((Get-Content $PackageJSONFile -Raw -Encoding UTF8 -Force) -replace "./app_launcher/qqntim.js", "./app_launcher/index.js"), $Utf8NoBomEncoding)

Remove-Item $QQNTimFlagFile -Force

if ((Test-Path $SuccessFlagFile) -eq $false) {
    "" | Out-File $SuccessFlagFile -Encoding UTF8 -Force
}

Write-Output "卸载成功。卸载程序将在 5 秒后退出。"
Start-Sleep 5
