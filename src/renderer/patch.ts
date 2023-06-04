import { Module } from "module";

type IPCArgs = [{ type: string; eventName: string; callbackId: string }, any[]];
export type InterruptIPC = (args: IPCArgs) => boolean | undefined;

const interruptIpcs: InterruptIPC[] = [];

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
            const ipcRenderer = {
                ...loadedModule.ipcRenderer,
                on(channel: string, listener: (event: any, ...args: any[]) => void) {
                    loadedModule.ipcRenderer.on(
                        channel,
                        (event: any, ...args: IPCArgs) => {
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
                                            msg.elements[0]?.grayTipElement?.revokeElement
                                        ) {
                                            if (
                                                msg.elements[0]?.grayTipElement
                                                    ?.revokeElement?.isSelfOperate
                                            )
                                                continue;
                                            args[1][0].cmdName =
                                                "nodeIKernelMsgListener/onRecvMsg";
                                            msg.msgId = (Math.random() * 20).toString();
                                            break;
                                        }
                                    }
                                }
                            listener(event, ...args);
                        }
                    );
                },
            };
            Object.setPrototypeOf(ipcRenderer, loadedModule.ipcRenderer);
            patchedElectron = {
                ...loadedModule,
                ipcRenderer: ipcRenderer as any,
            };
            return patchedElectron;
        }
        return loadedModule;
    };
}

export function addInterruptIpc(newInterruptIpc: InterruptIPC) {
    interruptIpcs.push(newInterruptIpc);
}
