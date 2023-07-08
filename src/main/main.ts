/**
 * @license
 * Copyright (c) Flysoft.
 */

import { collectPlugins, plugins } from "./plugins";
import { applyPlugins } from "./loader";
import { patchElectron } from "./patch";
import { hookPostPatchElectron } from "./compatibility";

patchElectron();
hookPostPatchElectron();
collectPlugins();
applyPlugins(plugins);
console.log("[!Main] QQNTim 加载成功");

require("./index.js");
