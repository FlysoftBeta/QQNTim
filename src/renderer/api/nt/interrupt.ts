import { addInterruptIpc } from "../../../common/ipc";
import { webContentsId } from "../../main";

export function ntInterrupt(callback: QQNTim.IPC.InterruptFunction, eventName: string, cmdName: string, direction?: QQNTim.IPC.Direction, type?: QQNTim.IPC.Type) {
    addInterruptIpc(callback, { type: type, eventName: `${eventName}-${webContentsId}`, cmdName: cmdName, direction: direction });
}
