import { setAllPlugins, setEnv } from "../globalVar";
import { watchIpc } from "../ipc";
import { nt } from "./api/nt";
import { attachDebugger } from "./debugger";
import { applyPlugins } from "./loader";
import { patchElectron } from "./patch";
import { hookVue3 } from "./vueHelper";
import { ipcRenderer } from "electron";
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";

export const { enabled, preload, debuggerOrigin, webContentsId, plugins, env } = ipcRenderer.sendSync("___!boot", {
    eventName: "QQNTIM_BOOT",
});

if (enabled) {
    setEnv(env);
    setAllPlugins(plugins);
    watchIpc();
    hookVue3();
    attachDebugger(webContentsId, debuggerOrigin);
    nt.init();

    (window as any).React = React;
    (window as any).ReactDOMClient = ReactDOMClient;

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

patchElectron();

preload.forEach((item: string) => require(item));
