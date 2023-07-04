import { contextBridge, ipcRenderer } from "electron";
import { applyPlugins } from "./loader";
import { patchElectron } from "./patch";
import { attachDebugger } from "./debugger";
import { nt } from "./api/nt";

const { debuggerOrigin, debuggerId, plugins, resourceDir } = ipcRenderer.sendSync(
    "___!boot",
    {
        eventName: "QQNTIM_BOOT",
    }
);

attachDebugger(debuggerId, debuggerOrigin);

const timer = setInterval(() => {
    if (window.location.href.includes("blank")) return;
    clearInterval(timer);
    applyPlugins(plugins);
    nt.getAccountInfo().then((account) => {
        const uin = account.uin;
        applyPlugins(plugins, uin);
        ipcRenderer.sendSync(
            "___!apply_plugins",
            {
                eventName: "QQNTIM_APPLY_PLUGINS",
            },
            uin
        );
    });
    console.log("[!Main] QQNTim 加载成功");
}, 1);

patchElectron();

contextBridge.exposeInMainWorld("electron", {
    load: (file) => {
        require(resourceDir +
            (process.platform == "win32" ? "/../major.node" : "/major.node")).load(
            file,
            module
        );
    },
});
require(resourceDir +
    (process.platform == "win32" ? "/../major.node" : "/major.node")).load(
    "p_preload",
    module
);
