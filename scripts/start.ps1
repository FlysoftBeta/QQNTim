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
$QQAppDir = "$QQInstallDir\resources\app"
$QQAppLauncherDir = "$QQAppDir\app_launcher"
$PackageJSONFile = "$QQAppDir\package.json"

Copy-Item ".\qqntim.js", ".\qqntim-renderer.js" $QQAppLauncherDir -Force
Copy-Item ".\node_modules", ".\builtins" $QQAppLauncherDir -Recurse -Force
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines($PackageJSONFile, ((Get-Content $PackageJSONFile -Raw -Encoding UTF8 -Force) -replace "./app_launcher/index.js", "./app_launcher/qqntim.js"), $Utf8NoBomEncoding)

Start-Process "$QQInstallDir\QQ.exe" -Wait 
