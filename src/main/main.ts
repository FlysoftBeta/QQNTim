/**
 * @license
 * Copyright (c) Flysoft.
 */

import { patchElectron } from "./patch";
import { collectPlugins, loadConfig, plugins, prepareConfigDir } from "./plugins";
import { setPlugins } from "./loader";

console.log("[!Main] QQNTim 加载成功");
try {
    prepareConfigDir();
    loadConfig();
    collectPlugins();
} catch (reason) {
    console.error(`[!Main] 无法加载配置`);
    console.error(reason);
}

try {
    setPlugins(plugins);
} catch (reason) {
    console.error(`[!Main] 无法加载插件`);
    console.error(reason);
}

try {
    patchElectron();
} catch (reason) {
    console.error(`[!Main] 无法修补 Electron 模块`);
    console.error(reason);
}
