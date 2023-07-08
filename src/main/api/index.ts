import { InterruptIPC, InterruptIPCOptions, InterruptWindowCreation, addInterruptIpc } from "../../ipc";
import { addInterruptWindowCreation } from "../patch";
import * as fs from "fs-extra";

export function getAPI() {
    return {
        interrupt: {
            ipc: (func: InterruptIPC, options?: InterruptIPCOptions) => addInterruptIpc(func, options),
            windowCreation: (func: InterruptWindowCreation) => addInterruptWindowCreation(func),
        },
        modules: {
            fs: fs,
        },
    };
}
