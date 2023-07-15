$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)

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

Start-Process "$QQInstallDir\QQ.exe" -Wait 