import { addInterruptIpc } from "../../../ipc";
import { webContentsId } from "../../main";
import { QQNTim } from "@flysoftbeta/qqntim-typings";

export function ntInterrupt(callback: QQNTim.IPC.InterruptFunction, eventName: string, cmdName: string, direction?: QQNTim.IPC.Direction, type?: QQNTim.IPC.Type) {
    addInterruptIpc(callback, { type: type, eventName: `${eventName}-${webContentsId}`, cmdName: cmdName, direction: direction });
}
