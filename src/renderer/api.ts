import * as fs from "fs-extra";
import { EventEmitter } from "events";
import { ipcRenderer } from "electron";
import { randomUUID } from "crypto";
import { MessageElement } from "../nt";
import {
    IPCArgs,
    IPCResponse,
    InterruptIPC,
    InterruptIPCOptions,
    addInterruptIpc,
} from "../ipc";

class NTError extends Error {
    public code: number;
    public message: string;
    constructor(code: number, message: string) {
        super();
        this.code = code;
        this.message = message;
    }
}

class NT extends EventEmitter {
    private pendingCallbacks: Record<string, Function> = {};
    constructor() {
        super();
        addInterruptIpc(
            (args) => {
                if (this.pendingCallbacks[args[0].callbackId])
                    this.pendingCallbacks[args[0].callbackId](args);
                return false;
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
            }
        );
    }
    private ntCall(cmd: string, args: any) {
        return new Promise<void>((resolve, reject) => {
            const uuid = randomUUID();
            console.log(uuid);
            this.pendingCallbacks[uuid] = (args: IPCArgs<IPCResponse>) => {
                if (args[1] && args[1].result != 0)
                    reject(new NTError(args[1].result, args[1].errMsg));
                else resolve();
            };
            ipcRenderer.send(
                "IPC_UP_2",
                {
                    type: "request",
                    callbackId: uuid,
                    eventName: "ns-ntApi-2",
                },
                [cmd, args, null]
            );
        });
    }
    sendMessage(peer: string, elements: MessageElement[]) {
        return this.ntCall("nodeIKernelMsgService/sendMsg", {
            msgId: "0",
            peer: {
                chatType: 1,
                peerUid: peer,
                guildId: "",
            },
            msgElements: elements.map((element) => {
                if (element.type == "text")
                    return {
                        elementType: 1,
                        elementId: "",
                        textElement: {
                            content: element.content,
                            atType: 0,
                            atUid: "",
                            atTinyId: "",
                            atNtUid: "",
                        },
                    };
            }),
        });
    }
}

const waitForElementSelectors: [string, (element: HTMLElement) => void][] = [];

export function refreshWaitForElementStatus() {
    waitForElementSelectors.forEach((item, idx) => {
        const ele = document.querySelector<HTMLElement>(item[0]);
        if (ele) {
            item[1](ele);
            waitForElementSelectors.splice(idx);
        }
    });
}

export function getAPI(windowLoadPromise: Promise<void>) {
    const nt = new NT();

    return {
        interrupt: {
            ipc: (func: InterruptIPC, options?: InterruptIPCOptions) =>
                addInterruptIpc(func, options),
        },
        nt: nt,
        modules: {
            fs: fs,
        },
        utils: {
            waitForElement: (selector: string) => {
                return new Promise<HTMLElement>((resolve) => {
                    waitForElementSelectors.push([
                        selector,
                        (element) => {
                            resolve(element);
                        },
                    ]);
                    refreshWaitForElementStatus();
                });
            },
        },
        windowLoadPromise: windowLoadPromise,
    };
}
