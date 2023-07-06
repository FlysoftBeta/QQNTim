/**
 * @license
 * Copyright (c) Flysoft.
 */

import { collectPlugins, loadConfig, plugins, prepareConfigDir } from "./plugins";
import { applyPlugins } from "./loader";
import { patchElectron } from "./patch";
import { hookPostPatchElectron } from "./compatibility";

patchElectron();
hookPostPatchElectron();
prepareConfigDir();
loadConfig();
collectPlugins();
applyPlugins(plugins);
console.log("[!Main] QQNTim 加载成功");

require("./index.js");
