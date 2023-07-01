/**
 * @license
 * Copyright (c) Flysoft.
 */

import { collectPlugins, loadConfig, plugins, prepareConfigDir } from "./plugins";
import { setPlugins } from "./loader";
import { patchElectron } from "./patch";

function loadPlugins() {
    prepareConfigDir();
    loadConfig();
    collectPlugins();
    setPlugins(plugins);
    patchElectron();
    console.log("[!Main] QQNTim 加载成功");
}

loadPlugins();
require("./launcher.node").load("external_index", module);
