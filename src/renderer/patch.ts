import { Module } from "module";
import { ipcRenderer } from "electron";
import { IPCArgs, handleIpc } from "../ipc";
import { getter, setter } from "../watch";

function patchIpcRenderer() {
    return new Proxy(ipcRenderer, {
        get(target, p) {
            if (p == "on")
                return (
                    channel: string,
                    listener: (event: any, ...args: any[]) => void
                ) => {
                    target.on(channel, (event: any, ...args: IPCArgs<any>) => {
                        if (handleIpc(args, "in", channel)) listener(event, ...args);
                    });
                };
            else if (p == "send")
                return (channel: string, ...args: IPCArgs<any>) => {
                    if (handleIpc(args, "out", channel)) target.send(channel, ...args);
                };
            else if (p == "sendSync")
                return (channel: string, ...args: IPCArgs<any>) => {
                    if (handleIpc(args, "out", channel))
                        return target.sendSync(channel, ...args);
                };
            return getter("ipcRenderer", target, p as any);
        },
        set(target, p, newValue) {
            return setter("ipcRenderer", target, p as any, newValue);
        },
    });
}

export function patchElectron() {
    let patchedElectron: typeof Electron.CrossProcessExports;
    const loadBackend = (Module as any)._load;
    (Module as any)._load = (request: string, parent: NodeModule, isMain: boolean) => {
        // Hide `vm` deprecation notice.
        if (request == "vm") request = "node:vm";

        const loadedModule = loadBackend(
            request,
            parent,
            isMain
        ) as typeof Electron.CrossProcessExports;
        if (request == "electron") {
            if (!patchedElectron)
                patchedElectron = {
                    ...loadedModule,
                    ipcRenderer: patchIpcRenderer(),
                };
            return patchedElectron;
        }
        return loadedModule;
    };
}
