import { addInterruptIpc } from "../../../ipc";
import { webContentsId } from "../../main";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import { randomUUID } from "crypto";
import { ipcRenderer } from "electron";

class NTCallError extends Error {
    public code: number;
    public message: string;
    constructor(code: number, message: string) {
        super();
        this.code = code;
        this.message = message;
    }
}

const pendingCallbacks: Record<string, Function> = {};

addInterruptIpc(
    (args) => {
        const id = args[0].callbackId;
        if (pendingCallbacks[id]) {
            pendingCallbacks[id](args);
            delete pendingCallbacks[id];
            return false;
        }
    },
    {
        direction: "in",
    },
);

export function ntCall(eventName: string, cmdName: string, args: any[], isRegister = false) {
    return new Promise<any>((resolve, reject) => {
        const uuid = randomUUID();
        pendingCallbacks[uuid] = (args: QQNTim.IPC.Args<QQNTim.IPC.Response>) => {
            if (args[1] && args[1].result != undefined && args[1].result != 0) reject(new NTCallError(args[1].result, args[1].errMsg));
            else resolve(args[1]);
        };
        ipcRenderer.send(
            `IPC_UP_${webContentsId}`,
            {
                type: "request",
                callbackId: uuid,
                eventName: `${eventName}-${webContentsId}${isRegister ? "-register" : ""}`,
            },
            [cmdName, ...args],
        );
    });
}
