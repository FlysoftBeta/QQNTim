# QQNT-Improved - PC 端 QQNT 插件管理器

QQNT-Improved (简称 QQNTim) 是一个给 QQNT 的插件管理器，目前处于 Alpha 版本阶段，支持 Windows，Linux 等平台。

## 安装和卸载

### Windows

安装前请确保电脑上已经安装了 QQNT (Windows 版需要有内测资格)。
请右键使用 PowerShell 运行 `install.ps1` 安装插件管理器，`uninstall.ps1` 卸载插件管理器。
建议在安装后安装插件。

**注意:** 如果遇到脚本无法打开的情况，请在运行 (Win+R) 中输入以允许 PowerShell 运行脚本：

```powershell
powershell -Command Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
```

### Linux

安装前请确保电脑上已经安装了 QQNT。
我们已经提供了现有的快速安装脚本，你只需要在安装脚本目录下打开终端运行：

```bash
# 允许脚本运行
chmod +x ./install.sh ./uninstall.sh

# 安装插件管理器
sudo ./install.sh

# 卸载插件管理器
sudo ./uninstall.sh
```

## 使用

按 F5 刷新当前页面，F12 打开开发者工具。

### 安装插件

目前，你可以到 [Plugins Galaxy](https://github.com/FlysoftBeta/QQNTim-Plugins-Galaxy) 下载插件。

将下载的插件**解压到插件文件夹下并重启 QQ**，插件即可生效。

#### Windows

插件文件夹位于 `用户文件夹\.qqntim\plugins`

#### Linux

插件文件夹位于 `用户文件夹/.local/share/QQNTim/plugins`

## 开发

### 本体

本项目使用 Yarn berry 作为包管理器，运行以下命令配置项目：

```bash
corepack enable
yarn
```

运行以下指令构建项目，构建产物在 `dist` 文件夹下。

```bash
yarn build
```

### 插件

未完待续...
