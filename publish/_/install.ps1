$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "QQNTim 安装程序 (PowerShell)"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)

if (-Not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    if ([int](Get-CimInstance -Class Win32_OperatingSystem | Select-Object -ExpandProperty BuildNumber) -ge 6000) {
        throw "权限不足。" 
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
    throw "未找到 QQNT 安装目录。"
}
$QQAppDir = "$QQInstallDir\resources\app"
$QQAppLauncherDir = "$QQAppDir\app_launcher"
$EntryFile = "$QQAppLauncherDir\index.js"
$EntryBackupFile = "$EntryFile.bak"
$PackageJSONFile = "$QQAppDir\package.json"
$QQNTimFlagFile = "$QQAppLauncherDir\qqntim-flag.txt"
$SuccessFlagFile = "$env:TEMP\qqntim-install-successful.tmp"

if ((Test-Path $EntryBackupFile) -eq $true) {
    Write-Output "正在清理旧版 QQNTim……"
    Move-Item $EntryBackupFile $EntryFile -Force
    "" | Out-File $QQNTimFlagFile -Encoding UTF8 -Force
}

if ((Test-Path $QQNTimFlagFile) -eq $false) {
    if ((Read-Host "是否要安装 QQNTim (y/n)？") -notcontains "y") {
        throw "安装已被用户取消。"
    }
}
else {
    Write-Output "检测到已有安装，正在更新……"
}

Write-Output "正在关闭 QQ……"
Stop-Process -Name QQ -ErrorAction SilentlyContinue

Write-Output "正在复制文件……"
Copy-Item ".\qqntim.js", ".\qqntim-renderer.js" $QQAppLauncherDir -Force
Copy-Item ".\node_modules" $QQAppLauncherDir -Recurse -Force

Write-Output "正在修补 package.json……"
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines($PackageJSONFile, ((Get-Content $PackageJSONFile -Raw -Encoding UTF8 -Force) -replace "./app_launcher/index.js", "./app_launcher/qqntim.js"), $Utf8NoBomEncoding)

if ((Test-Path $QQNTimFlagFile) -eq $false) {
    "" | Out-File $QQNTimFlagFile -Encoding UTF8 -Force
}

if ((Test-Path $SuccessFlagFile) -eq $false) {
    "" | Out-File $SuccessFlagFile -Encoding UTF8 -Force
}

Write-Output "安装成功。安装程序将在 5 秒后退出。"
Start-Sleep 5

