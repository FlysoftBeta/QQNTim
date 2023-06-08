/**
 * @license
 * Copyright (c) Flysoft.
 */

import { patchElectron } from "./patch";
import { collectPlugins, plugins, prepareConfigDir } from "./plugins";
import { setPlugins } from "./loader";

console.log("[!Main] QQNTim 加载成功");
try {
    prepareConfigDir();
    collectPlugins();
    setPlugins(plugins);
} catch (reason) {
    console.error(`[!Main] 无法加载插件`);
    console.error(reason);
}

try {
    patchElectron();
} catch (reason) {
    console.error(`[!Main] 无法劫持 Electron 模块`);
    console.error(reason);
}
