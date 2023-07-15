/**
 * @license
 * Copyright (c) Flysoft.
 */

import { setAllPlugins, setEnv } from "../common/global";
import { watchIpc } from "../common/ipc";
import { initAPI } from "./api";
import { loadCustomLoaders } from "./compatibility";
import { loadConfig } from "./config";
import { initDebugger } from "./debugger";
import { applyPlugins } from "./loader";
import { patchModuleLoader } from "./patch";
import { collectPlugins, plugins } from "./plugins";

setEnv(loadConfig());
initDebugger();
patchModuleLoader();
watchIpc();
loadCustomLoaders();
collectPlugins();
setAllPlugins(plugins);
initAPI();
applyPlugins(plugins);
console.log("[!Main] QQNTim 加载成功");
require("./index.js");
