import { setAllPlugins, setEnv } from "../common/global";
import { watchIpc } from "../common/ipc";
import { initAPI } from "./api";
import { nt } from "./api/nt";
import { attachDebugger } from "./debugger";
import { applyPlugins } from "./loader";
import { patchModuleLoader } from "./patch";
import { hookVue3 } from "./vueHelper";
import { ipcRenderer } from "electron";

export const { enabled, preload, debuggerOrigin, webContentsId, plugins, env } = ipcRenderer.sendSync("___!boot");

patchModuleLoader();
if (enabled) {
    setEnv(env);
    setAllPlugins(plugins);
    watchIpc();
    hookVue3();
    attachDebugger();
    initAPI();

    const timer = setInterval(() => {
        if (window.location.href.includes("blank")) return;
        clearInterval(timer);
        applyPlugins(plugins);
        nt.getAccountInfo().then((account) => {
            if (!account) return;
            const uin = account.uin;
            applyPlugins(plugins, uin);
        });
        console.log("[!Main] QQNTim 加载成功");
    }, 1);
}

preload.forEach((item: string) => require(item));
