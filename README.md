# QQNT-Improved - PC 端 QQNT 插件管理器

QQNT-Improved (简称 QQNTim) 是一个给 QQNT 的插件管理器，目前处于 Alpha 版本阶段，支持 Windows，Linux 等平台。

本程序**不提供任何担保**（包括但不限于使用导致的系统故障、封号等）。

## 简介

QQNTim 是一个用于管理插件的程序，其功能全部需要通过[安装插件](#插件)实现。

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

### 快捷键

按 F5 刷新当前页面，F12 打开开发者工具。

### 插件

目前，你可以到 [Plugins Galaxy](https://github.com/FlysoftBeta/QQNTim-Plugins-Galaxy) 下载插件。

将下载的插件**解压到插件文件夹下并重启 QQ**，插件即可生效。

#### Windows

插件文件夹位于 `用户文件夹\.qqntim\plugins`

#### Linux

插件文件夹位于 `用户文件夹/.local/share/QQNTim/plugins`

## 插件管理器本体开发

本项目使用 Yarn berry 作为包管理器，运行以下命令配置项目：

```bash
corepack enable
yarn
```

运行以下指令构建项目，构建产物在 `dist` 文件夹下。

```bash
yarn build
```

## 插件开发

### 开始

可参考 [Plugins Galaxy](https://github.com/FlysoftBeta/QQNTim-Plugins-Galaxy) 中的插件进行开发。

你需要在**插件文件夹**下创建一个文件夹以存放你的插件文件。

### 插件信息

创建一个 `qqntim.json` 文件，里面应包含插件的基本信息。一个完整的 `qqntim.json` 示例如下：

```json
{
    // 此插件的唯一 ID，不能与其他插件重复
    "id": "my-plugin",
    // 显示名称
    "name": "我的插件",
    // 作者
    "author": "我",
    // (可选) 插件加载条件 (需要满足全部条件才会加载)
    "requirements": {
        // (可选) 限定插件支持的操作系统版本 (满足其中一个条件即可)
        "os": [
            {
                // 插件支持的操作系统平台，可以是：
                // win32 (Windows)，linux (Linux)，darwin (macOS)
                "platform": "win32",
                // ----------------------------------
                // 可以使用多个项目来指定一个区间，例如：
                // {
                //     "platform": "win32",
                //     "lte": "10.0.22621",
                //     "gte": "6.1"
                // }
                // 代表满足 Windows 7 <= 当前系统版本 <= Windows 11 22H2
                // (6.1 <= 当前系统版本 <= 10) 时加载插件
                "lte": "x", // (可选) 当前版本小于等于 x
                "lt": "x", // (可选) 当前版本小于 x
                "gte": "x", // (可选) 当前版本大于等于 x
                "gt": "x", // (可选) 当前版本大于 x
                "eq": "x" // (可选) 当前系统版本等于 x
                // ----------------------------------
            }
        ]
    },
    "injections": [
        // 为 QQNT 注入脚本
        // 为主进程注入脚本
        {
            "type": "main",
            // (可选) 待注入的脚本文件
            "script": "main.js"
        },
        // 为渲染进程注入脚本或 CSS 样式表
        {
            "type": "renderer",
            // (可选) 只有网页 URL 匹配此正则表达式时此注入才生效
            "pattern": ".*",
            // (可选) 只有在指定窗口此注入才生效，可以是：
            // login (登录)，main (聊天)，settings (设置)，others (其他)
            "page": ["main", "login"],
            // (可选) 待注入的脚本文件
            "script": "main.js",
            // (可选) 待注入的样式文件
            "stylesheet": "style.css"
        }
    ]
}
```

### 脚本

主进程脚本文件和渲染进程脚本文件需要导出一个函数，该函数即为插件的入口，示例如下：

```javascript
module.exports = (qqntim) => {
    console.log("Say hello!", qqntim);
};
```

#### 主进程

主进程脚本可用于实现拦截窗口创建，修改消息等目的。

##### 拦截窗口创建

要拦截窗口创建，为其添加额外的[参数](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)，请使用：

```javascript
module.exports = (qqntim) => {
    qqntim.interrupt.windowCreation((args) => {
        return {
            ...args,
            // 给窗口加上系统自带的边框 :)
            frame: true,
        };
    });
};
```

其中，`args` 是窗口参数，你需要在拦截函数内，返回一个新的修改后的窗口参数。

##### 拦截 IPC

要拦截渲染进程到主进程的 IPC ([进程间通讯](https://www.electronjs.org/docs/latest/tutorial/ipc))，请使用：

```javascript
module.exports = (qqntim) => {
    qqntim.interrupt.ipc((args) => {
        console.log("截获到一条消息！", args);
        // 接收
        return true;
        // 拒绝接收
        return false;
    });
};
```

你可以通过直接修改 `args` 修改消息内容。

#### 渲染进程

渲染脚本可用于修改 UI 界面，修改交互逻辑等。

##### 拦截 IPC

要拦截主进程到渲染进程的 IPC ([进程间通讯](https://www.electronjs.org/docs/latest/tutorial/ipc))，请使用：

```javascript
module.exports = (qqntim) => {
    qqntim.interrupt.ipc((args) => {
        console.log("截获到一条消息！", args);
        // 接收
        return true;
        // 拒绝接收
        return false;
    });
};
```

你可以通过直接修改 `args` 修改消息内容。

##### 等待页面加载、等待元素出现

有时，我们在加载插件时，页面还未完全加载，为了确保能选中自己需要的 DOM 元素，请使用：

```javascript
module.exports = (qqntim) => {
    qqntim.windowLoadPromise.then(() => {
        console.log("窗口加载完毕");
        // 现在你可以对界面元素进行修改了
        // 例如，现在我想在窗口控制区域放一个按钮，按下就显示：来自渲染进程的问候 :)
        qqntim.utils.waitForElement(".window-control-area").then((container) => {
            // 在 container 最前方增加一个按钮
            const button = document.createElement("div");
            button.innerHTML = `<i class="q-icon" style="width:16px;height:16px;align-items:center;color:var(--icon_primary);display:inline-flex;justify-content:center;"><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6.0001L8.00004 10L4 6" stroke="currentColor" stroke-linejoin="round" style="transform:rotateZ(180deg);transform-origin:center;"></path></svg></i>`;
            button.addEventListener("click", () => {
                alert("来自渲染进程的问候 :)");
            });
            container.insertBefore(button, container.firstElementChild);
        });
    });
};
```

## 协议

本程序使用 GNU Lesser General Public License v3.0 or later 协议发行。

请在此源代码树下的 [COPYING](./COPYING) 和 [COPYING.LESSER](./COPYING.LESSER) 查看完整的协议。
