$ErrorActionPreference = "Stop"

$Host.UI.RawUI.WindowTitle = "QQNTim 卸载程序 (PowerShell)"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)

# 判断是否拥有管理员权限
if (-Not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    if ([int](Get-CimInstance -Class Win32_OperatingSystem | Select-Object -ExpandProperty BuildNumber) -ge 6000) {
        throw "权限不足。" 
    }
}

# 从注册表获取 QQ 安装路径
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

$QQExecutableFile = "$QQInstallDir\QQ.exe"
$QQExecutableBackupFile = "$QQInstallDir\QQ.exe.bak"
$QQExecutableHashFile = "$QQInstallDir\QQ.exe.md5"
$QQAppDir = "$QQInstallDir\resources\app"
$QQAppLauncherDir = "$QQAppDir\app_launcher"
$QQNTimFlagFile = "$QQAppLauncherDir\qqntim-flag.txt"
$SuccessFlagFile = "$env:TEMP\qqntim-uninstall-successful.tmp"

# 清理旧版文件，恢复被修改的入口文件
if ((Test-Path "$QQAppLauncherDir\index.js.bak") -eq $true) {
    Write-Output "正在清理旧版 QQNTim……"
    Move-Item "$QQAppLauncherDir\index.js.bak" "$QQAppLauncherDir\index.js" -Force
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

if ($env:QQNTIM_UNINSTALLER_NO_KILL_QQ -ne "1") {
    Write-Output "正在关闭 QQ……"
    Stop-Process -Name QQ -ErrorAction SilentlyContinue
}

Write-Output "正在移除文件……"
if ((Test-Path "$QQAppLauncherDir\node_modules.zip.md5") -eq $true) {
    Remove-Item "$QQAppLauncherDir\node_modules.zip.md5" -Force
}
Remove-Item "$QQAppLauncherDir\qqntim.js", "$QQAppLauncherDir\qqntim-renderer.js", "$QQAppLauncherDir\node_modules", "$QQAppLauncherDir\builtins" -Recurse -Force

Write-Output "正在还原 package.json……"
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines("$QQAppDir\package.json", ((Get-Content "$QQAppDir\package.json" -Encoding UTF8 -Force) -replace "./app_launcher/qqntim.js", "./app_launcher/index.js"), $Utf8NoBomEncoding)

Write-Output "正在还原 QQ.exe……"
if ((Test-Path $QQExecutableHashFile) -eq $true) {
    Remove-Item $QQExecutableHashFile -Force
}
if ((Test-Path $QQExecutableBackupFile) -eq $true) {
    Remove-Item $QQExecutableFile -Force
    Move-Item $QQExecutableBackupFile $QQExecutableFile -Force
}

Remove-Item $QQNTimFlagFile -Force

if ((Test-Path $SuccessFlagFile) -eq $false) {
    "" | Out-File $SuccessFlagFile -Encoding UTF8 -Force
}

if ($env:QQNTIM_UNINSTALLER_NO_DELAYED_EXIT -ne "1") {
    Write-Output "卸载成功。卸载程序将在 5 秒后自动退出。"
    Start-Sleep -Seconds 5
}
else {
    Write-Output "卸载成功。"
}