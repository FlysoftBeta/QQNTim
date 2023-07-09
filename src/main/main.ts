/**
 * @license
 * Copyright (c) Flysoft.
 */

import { setEnv } from "../config";
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
applyPlugins(plugins);
console.log("[!Main] QQNTim 加载成功");
require("./index.js");
