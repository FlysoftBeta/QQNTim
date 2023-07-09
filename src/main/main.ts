/**
 * @license
 * Copyright (c) Flysoft.
 */

import { setAllPlugins, setEnv } from "../globalVar";
import { watchIpc } from "../ipc";
import { hookAfterPatchElectron } from "./compatibility";
import { loadConfig } from "./config";
import { initDebugger } from "./debugger";
import { applyPlugins } from "./loader";
import { patchElectron } from "./patch";
import { collectPlugins, plugins } from "./plugins";

setEnv(loadConfig());
watchIpc();
initDebugger();
patchElectron();
hookAfterPatchElectron();
collectPlugins();
setAllPlugins(plugins);
applyPlugins(plugins);
console.log("[!Main] QQNTim 加载成功");
require("./index.js");
