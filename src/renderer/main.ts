import { nt } from "./api/nt";
import { attachDebugger } from "./debugger";
import { applyPlugins } from "./loader";
import { patchElectron } from "./patch";
import { ipcRenderer } from "electron";

const { preload, debuggerOrigin, debuggerId, plugins } = ipcRenderer.sendSync("___!boot", {
    eventName: "QQNTIM_BOOT",
});

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

require(preload);
