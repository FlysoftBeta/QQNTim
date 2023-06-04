import { contextBridge, ipcRenderer } from "electron";
import { setPlugins } from "./loader";
import { patchElectron } from "./patch";

console.log("QQNTim");
const { plugins, resourceDir } = ipcRenderer.sendSync("___!boot");

patchElectron();
const timer = setInterval(() => {
    if (window.location.href.includes("blank")) return;
    clearInterval(timer);
    setPlugins(plugins);
}, 1);
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
