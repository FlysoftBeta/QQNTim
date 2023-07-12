# 开发文档

此文档包含了插件开发文档（插件清单规范 v2.0）。

## 文件结构

### 数据文件夹

请查看 [使用手册-数据文件夹](MANUAL.md#数据文件夹) 查看默认的数据文件夹路径及其修改方式。

数据文件夹存放了所有插件和设置。

以下是一个结构示意图：

```
QQNTim
  ├─ plugins
  ├─ plugins-user
  └─ config.json
```

### `plugins` 文件夹

存放所有插件的文件夹。在此文件夹下的插件**对所有账户都生效**。

以下是一个结构示意图：

```
plugins
  ├─ 插件1 (文件夹)
  │  ├─ qqntim.json
  │  ├─ renderer.js
  │  └─ style.css
  └─ 插件2 (文件夹)
     ├─ qqntim.json
     ├─ main.js
     ├─ renderer.js
     ├─ example.jpg
     └─ native.node
```

### `plugins-user` 文件夹

存放指定账户插件的文件夹。在此文件夹下的插件**只对指定账户生效**。

以下是一个结构示意图：

```
plugins-user
  ├─ 10000
  │  ├─ 插件1
  │  └─ 插件2
  └─ 10001
     └─ ...
```

### `config.json` 文件

存放 QQNTim 配置的文件。

一个示例配置文件如下所示：

```json
{
    // (可选) 插件加载相关设置
    "plugins": {
        // 插件加载黑、白名单
        // (应指定插件的 ID，可以在插件的 qqntim.json 内的 id 栏查看)
        // ----------------------------------------------------
        // (string[] 可选) 插件加载白名单
        "whitelist": [],
        // (string[] 可选) 插件加载黑名单
        "blacklist": ["mica", "mica-ui"]
        // ----------------------------------------------------
    }
}
```

## 插件文件夹

插件文件夹存放了所有插件和设置。

### `qqntim.json` 文件

存放插件信息的清单文件，包含了插件的基本信息、插件加载条件、要注入的 [JS 脚本](#js-文件)等。

类型：[Manifest](#manifest)

一个完整的示例如下：

```json
{
    "manifestVersion": "2.0",
    "id": "my-plugin",
    "name": "我的插件",
    "author": "Flysoft",
    "requirements": {
        "os": [
            {
                "platform": "win32",
                "lte": "10.0.22621",
                "gte": "6.1.0"
            }
        ]
    },
    "injections": [
        {
            "type": "main",
            "script": "main.js"
        },
        {
            "type": "renderer",
            "page": ["main", "chat"],
            "script": "main.js",
            "stylesheet": "style.css"
        }
    ]
}
```

### `*.js` 文件

脚本入口文件。

#### 主进程脚本

该脚本必须使用 CommonJS 标准默认导出一个实现 [`QQNTim.Entry.Main`](src/typings/index.d.ts) 的类。

一个示例如下：

```typescript
import { QQNTim } from "@flysoftbeta/qqntim-typings";
// 例子：QQNT 启动时显示一条 Hello world! 控制台信息
// `qqntim` 内包含了很多实用的 API，可以帮助你对 QQNT 做出修改
export default class Entry implements QQNTim.Entry.Main {
    constructor(qqntim: QQNTim.API.Main.API) {
        console.log("Hello world!", qqntim);
    }
}
```

#### 渲染进程脚本

该脚本必须使用 CommonJS 标准默认导出一个实现 [`QQNTim.Entry.Renderer`](src/typings/index.d.ts) 的类。

一个示例如下：

```typescript
import { QQNTim } from "@flysoftbeta/qqntim-typings";
// 例子：QQNT 启动时显示一条 Hello world! 控制台信息
// `qqntim` 内包含了很多实用的 API，可以帮助你对 QQNT 做出修改
export default class Entry implements QQNTim.Entry.Renderer {
    constructor(qqntim: QQNTim.API.Renderer.API) {
        console.log("Hello world!", qqntim);
    }
}
```

## 类型定义

请查看 QQNTim 的 [TypeScript 类型定义文件](src/typings/index.d.ts)。
