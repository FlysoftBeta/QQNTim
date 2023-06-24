/**
 * @license
 * Copyright (c) Flysoft.
 */

import { patchElectron } from "./patch";
import { collectPlugins, loadConfig, plugins, prepareConfigDir } from "./plugins";
import { setPlugins } from "./loader";
import { initDebugger } from "./debugger";
import { useNativeDevTools } from "../env";

function init() {
    console.log("[!Main] QQNTim 开始加载");
    prepareConfigDir();
    loadConfig();
    collectPlugins();
    setPlugins(plugins);
    patchElectron();
    console.log("[!Main] QQNTim 加载成功");
}

if (!useNativeDevTools) initDebugger();
init();
require("./launcher.node").load("external_index", module);
