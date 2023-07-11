# 开发文档

此文档包含了插件开发文档。

## 文件结构

### 数据文件夹

数据文件夹存放了所有插件和设置。

在 Windows 下，默认数据文件夹位于 `%UserProfile%\.qqntim`。
在 Linux 下，默认数据文件夹位于 `$HOME/.local/share/QQNTim`。

通过设置 `QQNTIM_HOME` 可以修改数据文件夹的位置。

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

脚本入口文件。该脚本必须使用 CommonJS 标准导出一个签名为 `(qqntim: APIRenderer) => void` 的函数。

一个示例如下：

```js
// 例子：QQNT 启动时显示一条 Hello world! 控制台信息
// qqntim 内包含了很多实用的 API，可以帮助你对 QQNT 做出修改
module.exports = (qqntim) => {
    console.log("Hello world!", qqntim);
};
```

## 类型定义

### Manifest

| 名称         | 类型                                            | 可选 | 说明           |
| ------------ | ----------------------------------------------- | ---- | -------------- |
| id           | string                                          |      | 唯一 ID        |
| name         | string                                          |      | 显示名称       |
| author       | string                                          |      | 作者           |
| injections   | [ManifestInjection](#manifestinjection)[]       |      | 脚本和样式注入 |
| requirements | [ManifestRequirements](#manifestrequirements)[] | \*   | 加载条件       |

### ManifestInjection

可以是 [ManifestInjectionMain](#manifestinjectionmain) | [ManifestInjectionRenderer](#manifestinjectionrenderer)

### ManifestInjectionMain

| 名称   | 类型   | 可选 | 说明                                    |
| ------ | ------ | ---- | --------------------------------------- |
| type   | "main" |      | 向主进程注入脚本时，此项必须置为 "main" |
| script | string | \*   | 注入的脚本文件 (\*.js)                  |

> **注意：** 脚本文件的路径只能是相对于插件文件夹的路径。

### ManifestInjectionRenderer

| 名称       | 类型   | 可选 | 说明                                          |
| ---------- | ------ | ---- | --------------------------------------------- |
| type       | "main" |      | 向渲染进程注入脚本时，此项必须置为 "renderer" |
| page       | Page[] | \*   | 指定此注入生效的页面                          |
| pattern    | string | \*   | 指定此注入生效的页面 (正则表达式匹配)         |
| stylesheet | string | \*   | 注入的样式文件 (\*.css)                       |
| script     | string | \*   | 注入的脚本文件 (\*.js)                        |

> **注意：** 样式和脚本文件的路径只能是相对于插件文件夹的路径。

### Page

可以是 "login" | "main" | "chat" | "settings" | "others"。

### ManifestRequirements

| 名称 | 类型                     | 可选 | 说明                       |
| ---- | ------------------------ | ---- | -------------------------- |
| os   | ManifestRequirementsOS[] | \*   | 指定插件支持的操作系统列表 |

### ManifestRequirementsOS

| 名称     | 类型                                                                                                                                            | 可选 | 说明                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------- |
| platform | [NodeJS.Platform](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/1e1904e2588afe22d759094c21b90eac9caec018/types/node/process.d.ts#L51) |      | 支持的操作系统类型               |
| lte      | string                                                                                                                                          | \*   | `x` 须小于等于当前的操作系统版本 |
| lt       | string                                                                                                                                          | \*   | `x` 须小于当前的操作系统版本     |
| gte      | string                                                                                                                                          | \*   | `x` 须大于等于当前的操作系统版本 |
| gt       | string                                                                                                                                          | \*   | `x` 须大于当前的操作系统版本     |
| eq       | string                                                                                                                                          | \*   | `x` 须等于当前的操作系统版本     |

可以使用多个属性来指定一个版本区间，例如：

```json
{
    "platform": "win32",
    "lte": "10.0.22621",
    "gte": "6.1.0"
}
```

代表满足 Windows 7 <= 当前系统版本 <= Windows 11 22H2
(6.1 <= 当前系统版本 <= 10.0.22621) 时加载插件。

> **注意：** 版本号必须为 x.y.z 的形式。
