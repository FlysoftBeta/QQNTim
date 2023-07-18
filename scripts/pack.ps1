$ErrorActionPreference = "Stop"

Set-Location ((Split-Path -Parent $MyInvocation.MyCommand.Definition) + "\..")
$CD = (Get-Location).Path


$SourceDirPath = "$CD\dist\_\node_modules"
$DestinationZipPath = "$CD\dist\_\node_modules.zip"

# 设置特定时间戳，确保两次构建结果 Hash 不变
Get-ChildItem $SourceDirPath -Recurse | ForEach-Object { $_.LastWriteTimeUtc = "01/01/1970 08:00:00"; $_.LastAccessTimeUtc = "01/01/1970 08:00:00"; $_.CreationTimeUtc = "01/01/1970 08:00:00"; }

# 打包 node_modules
# 仅支持 .NET Framework 4.5 及以上
Add-Type -AssemblyName System.IO.Compression.Filesystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($SourceDirPath, $DestinationZipPath)
Remove-Item $SourceDirPath -Recurse -Force

# 生成 MD5 校验和
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($DestinationZipPath, (Get-FileHash "$DestinationZipPath.md5" -Algorithm MD5).Hash, $Utf8NoBomEncoding)
