import { Module } from "module";
import type { IPCArgs, InterruptIPC } from "../ipc";

const interruptIpcs: InterruptIPC[] = [];

function patchIpcRenderer(ipcRenderer: typeof Electron.ipcRenderer) {
    const object = {
        ...ipcRenderer,
        on(channel: string, listener: (event: any, ...args: any[]) => void) {
            ipcRenderer.on(channel, (event: any, ...args: IPCArgs) => {
                for (const func of interruptIpcs) {
                    const ret = func(args);
                    if (ret == false) return;
                }
                if (args[1])
                    if (
                        args[1][0]?.cmdName ==
                        "nodeIKernelMsgListener/onMsgInfoListUpdate"
                    ) {
                        for (const msg of args[1][0].payload.msgList) {
                            if (
                                msg.elements[0] &&
                                msg.elements[0].grayTipElement?.revokeElement &&
                                !msg.elements[0].grayTipElement.revokeElement
                                    .isSelfOperate
                            ) {
                                // Rewrite revoke element to new message
                                args[1][0].cmdName = "nodeIKernelMsgListener/onRecvMsg";
                                msg.msgId = (Math.random() * 20).toString();
                                break;
                            }
                        }
                    }
                listener(event, ...args);
            });
        },
    };
    Object.setPrototypeOf(object, ipcRenderer);

    return object as any as typeof Electron.ipcRenderer;
}

export function patchElectron() {
    let patchedElectron: typeof Electron.CrossProcessExports;
    const loadBackend = (Module as any)._load;
    (Module as any)._load = (request: string, parent: NodeModule, isMain: boolean) => {
        // Hide `vm` deprecation notice
        if (request == "vm") request = "node:vm";
        const loadedModule = loadBackend(
            request,
            parent,
            isMain
        ) as typeof Electron.CrossProcessExports;
        if (request == "electron") {
            if (patchedElectron) return patchedElectron;
            patchedElectron = {
                ...loadedModule,
                ipcRenderer: patchIpcRenderer(loadedModule.ipcRenderer),
            };
            return patchedElectron;
        }
        return loadedModule;
    };
}

export function addInterruptIpc(func: InterruptIPC) {
    interruptIpcs.push(func);
}
