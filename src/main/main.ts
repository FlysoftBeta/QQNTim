/**
 * @license
 * Copyright (c) Flysoft.
 */

import { hookPostPatchElectron } from "./compatibility";
import { applyPlugins } from "./loader";
import { patchElectron } from "./patch";
import { collectPlugins, plugins } from "./plugins";

patchElectron();
hookPostPatchElectron();
collectPlugins();
applyPlugins(plugins);
console.log("[!Main] QQNTim 加载成功");

require("./index.js");
