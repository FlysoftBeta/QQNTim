import { Module } from "module";
import { IPCArgs, handleIpc } from "../ipc";

function patchIpcRenderer(ipcRenderer: typeof Electron.ipcRenderer) {
    const object = {
        ...ipcRenderer,
        on(channel: string, listener: (event: any, ...args: any[]) => void) {
            ipcRenderer.on(channel, (event: any, ...args: IPCArgs<any>) => {
                if (handleIpc(args, "in", channel)) listener(event, ...args);
            });
        },
        send(channel: string, ...args: IPCArgs<any>) {
            if (handleIpc(args, "out", channel)) ipcRenderer.send(channel, ...args);
        },
    };
    Object.setPrototypeOf(object, ipcRenderer);

    return object as any as typeof Electron.ipcRenderer;
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
                    ipcRenderer: patchIpcRenderer(loadedModule.ipcRenderer),
                };
            return patchedElectron;
        }
        return loadedModule;
    };
}
