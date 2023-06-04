# QQNT-Improved - PC 端 QQNT 插件管理器

QQNT-Improved (简称 QQNTim) 是一个给 QQNT 的插件管理器，目前处于 alpha 版本阶段，支持 Windows，Linux 等平台。

## 安装和卸载

### Windows

安装前请确保电脑上已经安装了 QQNT (Windows 版需要有内测资格)。
请右键使用 PowerShell 运行 `install.ps1` 安装插件管理器，`uninstall.ps1` 卸载插件管理器。
建议在安装后安装插件 `预制主题.zip`。

**注意:** 如果遇到脚本无法打开的情况，请在运行 (Win+R) 中输入以允许 PowerShell 运行脚本：

```powershell
powershell -Command Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
```

### Linux

未完待续...

## 使用

按 F5 刷新当前页面，F12 打开开发者工具。

## 安装插件

将下载的插件**解压到插件文件夹下并重启 QQ**，插件即可生效。

### Windows

插件文件夹位于 `用户文件夹\.qqntim\plugins`

### Linux

插件文件夹位于 `用户文件夹/.local/share/QQNTim/plugins`

## 开发插件

未完待续...
