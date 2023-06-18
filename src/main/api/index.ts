import * as fs from "fs-extra";
import {
    InterruptIPC,
    InterruptIPCOptions,
    InterruptWindowCreation,
    addInterruptIpc,
} from "../../ipc";
import { addInterruptWindowCreation } from "../patch";

export function getAPI() {
    return {
        interrupt: {
            ipc: (func: InterruptIPC, options?: InterruptIPCOptions) =>
                addInterruptIpc(func, options),
            windowCreation: (func: InterruptWindowCreation) =>
                addInterruptWindowCreation(func),
        },
        modules: {
            fs: fs,
        },
    };
}
