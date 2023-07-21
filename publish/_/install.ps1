$ErrorActionPreference = "Stop"

$Host.UI.RawUI.WindowTitle = "QQNTim 安装程序 (PowerShell)"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)
$CD = (Get-Location).Path

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
$PackageJSONFile = "$QQAppDir\package.json"
$QQNTimFlagFile = "$QQAppLauncherDir\qqntim-flag.txt"
$SuccessFlagFile = "$env:TEMP\qqntim-install-successful.tmp"

# 清理旧版文件，恢复被修改的入口文件
if ((Test-Path "$QQAppLauncherDir\index.js.bak") -eq $true) {
    Write-Output "正在清理旧版 QQNTim……"
    Move-Item "$QQAppLauncherDir\index.js.bak" "$QQAppLauncherDir\index.js" -Force
    "" | Out-File $QQNTimFlagFile -Encoding UTF8 -Force
}

# 询问用户，如果存在旧版则不提示
if ((Test-Path $QQNTimFlagFile) -eq $false) {
    if ((Read-Host "是否要安装 QQNTim (y/n)？") -notcontains "y") {
        throw "安装已被用户取消。"
    }
}
else {
    Write-Output "检测到已有安装，正在更新……"
}

if ($env:QQNTIM_INSTALLER_NO_KILL_QQ -ne "1") {
    Write-Output "正在关闭 QQ……"
    Stop-Process -Name QQ -ErrorAction SilentlyContinue
}

Write-Output "正在复制文件……"
# 如果 node_modules 不存在或已经过期则执行复制
if ((Test-Path .\node_modules.zip.md5) -eq $true -and (Test-Path .\node_modules.zip) -eq $true) {
    if ((Test-Path "$QQAppLauncherDir\node_modules.zip.md5") -eq $false -or (Get-Content "$QQAppLauncherDir\node_modules.zip.md5" -Encoding UTF8 -Force) -ne (Get-Content .\node_modules.zip.md5 -Encoding UTF8 -Force)) {
        $SourceZipPath = "$CD\node_modules.zip";
        $DestinationDirPath = "$QQAppLauncherDir\node_modules"
        # 清空原有 node_modules 文件夹
        if ((Test-Path $DestinationDirPath) -eq $true) {
            Remove-Item $DestinationDirPath -Recurse -Force
        }
        New-Item $DestinationDirPath -ItemType Directory -Force | Out-Null
        try {
            # 回退 1 - 仅支持 .NET Framework 4.5 及以上
            Add-Type -AssemblyName System.IO.Compression.Filesystem
            [System.IO.Compression.ZipFile]::ExtractToDirectory($SourceZipPath, $DestinationDirPath)
        }
        catch { 
            # 回退 2 - 使用系统 COM 复制 API
            $Shell = New-Object -ComObject Shell.Application
            $Shell.NameSpace($DestinationDirPath).CopyHere($Shell.NameSpace($SourceZipPath).Items())
        }
    }
    Copy-Item ".\node_modules.zip.md5" $QQAppLauncherDir -Recurse -Force
}
elseif ((Test-Path .\node_modules) -eq $true) {
    Copy-Item ".\node_modules" $QQAppLauncherDir -Recurse -Force
}
Copy-Item ".\qqntim.js", ".\qqntim-renderer.js", ".\builtins" $QQAppLauncherDir -Recurse -Force

Write-Output "正在修补 package.json……"
# 使用 UTF-8 without BOM 进行保存
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines($PackageJSONFile, ((Get-Content $PackageJSONFile -Encoding UTF8 -Force) -replace "./app_launcher/index.js", "./app_launcher/qqntim.js"), $Utf8NoBomEncoding)

# For QQ 9.9.1+
# 如果 QQ.exe 未被修补或已被新安装覆盖则进行修补
if ((Test-Path $QQExecutableHashFile) -eq $false -or (Get-Content $QQExecutableHashFile -Encoding UTF8 -Force) -replace "`r`n", "" -ne (Get-FileHash $QQExecutableFile -Algorithm MD5).Hash) {
    Write-Output "正在修补 QQ.exe，这可能需要一些时间……"
    Copy-Item $QQExecutableFile $QQExecutableBackupFile -Force
    # 引入 crypt32.dll 定义
    $Crypt32Def = @"
[DllImport("Crypt32.dll", CharSet = CharSet.Auto, SetLastError = true)]
public static extern bool CryptStringToBinary(
    string pszString,
    int cchString,
    int dwFlags,
    byte[] pbBinary,
    ref int pcbBinary,
    int pdwSkip,
    ref int pdwFlags
);
[DllImport("Crypt32.dll", CharSet = CharSet.Auto, SetLastError = true)]
public static extern bool CryptBinaryToString(
    byte[] pbBinary,
    int cbBinary,
    int dwFlags,
    StringBuilder pszString,
    ref int pcchString
);
"@
    Add-Type -MemberDefinition $Crypt32Def -Namespace PKI -Name Crypt32 -UsingNamespace "System.Text"
    $HexRawEncoding = 12

    $QQBin = [System.IO.File]::ReadAllBytes($QQExecutableFile)
    # Byte[] 转 Hex String
    $pcchString = 0 # Size
    if ([PKI.Crypt32]::CryptBinaryToString($QQBin, $QQBin.Length, $HexRawEncoding, $null, [ref]$pcchString)) {
        $QQHex = New-Object Text.StringBuilder $pcchString
        [void][PKI.Crypt32]::CryptBinaryToString($QQBin, $QQBin.Length, $HexRawEncoding, $QQHex, [ref]$pcchString)
        $PatchedQQHex = $QQHex.ToString() -replace "7061636b6167652e6a736f6e00696e6465782e6a73006c61756e636865722e6a73006c61756e636865722e6e6f646500", "696e6465782e6a730000000000696e6465782e6a73006c61756e636865722e6a73006c61756e636865722e6e6f646500" -replace "7061636b6167652e488d942400020000488902c742086a736f6e", "6c61756e63686572488d942400020000488902c742082e6a7300"
        # Hex String 转 Byte[]
        $pcbBinary = 0 # Size
        $pdwFlags = 0
        if ([PKI.Crypt32]::CryptStringToBinary($PatchedQQHex, $PatchedQQHex.Length, $HexRawEncoding, $null, [ref]$pcbBinary, 0, [ref]$pdwFlags)) {
            $PatchedQQBin = New-Object byte[] -ArgumentList $pcbBinary
            [void][PKI.Crypt32]::CryptStringToBinary($PatchedQQHex, $PatchedQQHex.Length, $HexRawEncoding, $PatchedQQBin, [ref]$pcbBinary, 0, [ref]$pdwFlags)

            # 写出文件
            [System.IO.File]::WriteAllBytes($QQExecutableFile, $PatchedQQBin)

            # 写出 MD5
            $QQFileHash = (Get-FileHash $QQExecutableFile -Algorithm MD5).Hash
            [System.IO.File]::WriteAllLines($QQExecutableHashFile, $QQFileHash, $Utf8NoBomEncoding)
        }
        else {
            throw $((New-Object ComponentModel.Win32Exception ([Runtime.InteropServices.Marshal]::GetLastWin32Error())).Message)
        }
    }
    else {
        throw $((New-Object ComponentModel.Win32Exception ([Runtime.InteropServices.Marshal]::GetLastWin32Error())).Message)
    }
}
else {
    Write-Output "QQ.exe 未更新，无需修补！"
}

if ((Test-Path $QQNTimFlagFile) -eq $false) {
    "" | Out-File $QQNTimFlagFile -Encoding UTF8 -Force
}

if ((Test-Path $SuccessFlagFile) -eq $false) {
    "" | Out-File $SuccessFlagFile -Encoding UTF8 -Force
}

if ($env:QQNTIM_INSTALLER_NO_DELAYED_EXIT -ne "1") {
    Write-Output "安装成功。安装程序将在 5 秒后自动退出。"
    Start-Sleep -Seconds 5
}
else {
    Write-Output "安装成功。"
}