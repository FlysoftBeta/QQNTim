import { setEnv } from "../config";
import { nt } from "./api/nt";
import { attachDebugger } from "./debugger";
import { applyPlugins } from "./loader";
import { patchElectron } from "./patch";
import { ipcRenderer } from "electron";
import { hookVue3 } from "./vueHelper";
import { watchIpc } from "../ipc";

const { enabled, preload, debuggerOrigin, debuggerId, plugins, env } = ipcRenderer.sendSync("___!boot", {
    eventName: "QQNTIM_BOOT",
});

if (enabled) {
    setEnv(env);
    watchIpc();
    hookVue3();
    attachDebugger(debuggerId, debuggerOrigin);

    const timer = setInterval(() => {
        if (window.location.href.includes("blank")) return;
        clearInterval(timer);
        applyPlugins(plugins);
        nt.getAccountInfo().then((account) => {
            const uin = account.uin;
            applyPlugins(plugins, uin);
            ipcRenderer.send(
                "___!apply_plugins",
                {
                    eventName: "QQNTIM_APPLY_PLUGINS",
                },
                uin,
            );
        });
        console.log("[!Main] QQNTim 加载成功");
    }, 1);

    patchElectron();
}

preload.forEach((item: string) => {
    if (item) require(item);
});
