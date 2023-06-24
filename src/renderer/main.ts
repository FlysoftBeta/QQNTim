import { contextBridge, ipcRenderer } from "electron";
import { setPlugins } from "./loader";
import { patchElectron } from "./patch";
import { useNativeDevTools } from "../env";

console.log("[!Main] QQNTim 开始加载");
const { debuggerOrigin, debuggerId, plugins, resourceDir } = ipcRenderer.sendSync(
    "___!boot",
    {
        eventName: "QQNTIM_BOOT",
    }
);

if (!useNativeDevTools)
    window.addEventListener("DOMContentLoaded", () => {
        const oldTitle = document.title;
        document.title = debuggerId;
        window.addEventListener("load", () => {
            document.title = oldTitle == "" ? "QQ" : oldTitle;
        });

        const scriptTag = document.createElement("script");
        scriptTag.src = `${debuggerOrigin}/target.js`;
        document.head.appendChild(scriptTag);
    });

const timer = setInterval(() => {
    if (window.location.href.includes("blank")) return;
    clearInterval(timer);
    setPlugins(plugins);
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
