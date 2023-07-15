$ErrorActionPreference = "Stop"

$Host.UI.RawUI.WindowTitle = "QQNTim 安装程序 (PowerShell)"
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
$QQExecutableFile = "$QQInstallDir\QQ.exe"
$QQExecutableBackupFile = "$QQInstallDir\QQ.exe.bak"
$QQExecutableHashFile = "$QQInstallDir\QQ.exe.md5"
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

if ($env:QQNTIM_INSTALLER_NO_KILL_QQ -ne "1") {
    Write-Output "正在关闭 QQ……"
    Stop-Process -Name QQ -ErrorAction SilentlyContinue
}

Write-Output "正在复制文件……"
Copy-Item ".\qqntim.js", ".\qqntim-renderer.js" $QQAppLauncherDir -Force
Copy-Item ".\node_modules", ".\builtins" $QQAppLauncherDir -Recurse -Force

Write-Output "正在修补 package.json……"
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines($PackageJSONFile, ((Get-Content $PackageJSONFile -Encoding UTF8 -Force) -replace "./app_launcher/index.js", "./app_launcher/qqntim.js"), $Utf8NoBomEncoding)

$QQFileHash = (Get-FileHash $QQExecutableFile -Algorithm MD5).Hash
if ((Test-Path $QQExecutableHashFile) -eq $false -or (Get-Content $QQExecutableHashFile -Encoding UTF8 -Force) -replace "`r`n", "" -ne $QQFileHash) {
    Write-Output "正在修补 QQ.exe，这可能需要一些时间……"
    Copy-Item $QQExecutableFile $QQExecutableBackupFile -Force
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
    $pcchString = 0
    if ([PKI.Crypt32]::CryptBinaryToString($QQBin, $QQBin.Length, $HexRawEncoding, $null, [ref]$pcchString)) {
        $QQHex = New-Object Text.StringBuilder $pcchString
        [void][PKI.Crypt32]::CryptBinaryToString($QQBin, $QQBin.Length, $HexRawEncoding, $QQHex, [ref]$pcchString)
        # 替换 package.json\0index.js\0launcher.js\0launcher.node 为 \0
        $PatchedQQHex = $QQHex.ToString() -replace "7061636b6167652e6a736f6e00696e6465782e6a73006c61756e636865722e6a73006c61756e636865722e6e6f646500", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        # Hex String 转 Byte[]
        $pcbBinary = 0
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

Write-Output "安装成功。"
