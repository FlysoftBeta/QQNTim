import { addInterruptIpc } from "../../../common/ipc";

export class NTWatcher<T extends string | number> {
    private pendingList = {} as Record<T, Function>;
    constructor(getId: (args: QQNTim.IPC.Args<any>) => T, eventName: string, cmdName: string, direction?: QQNTim.IPC.Direction, type?: QQNTim.IPC.Type) {
        addInterruptIpc(
            (args) => {
                const id = getId(args);
                if (this.pendingList[id]) {
                    this.pendingList[id](args);
                    delete this.pendingList[id];
                    return false;
                }
            },
            { type: type, eventName: eventName, cmdName: cmdName, direction: direction },
        );
    }
    wait(id: T) {
        return new Promise<QQNTim.IPC.Args<any>>((resolve) => {
            this.pendingList[id] = (args: QQNTim.IPC.Args<any>) => {
                resolve(args);
            };
        });
    }
}
