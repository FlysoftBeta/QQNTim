import * as fs from "fs-extra";
import { InterruptIPC, InterruptIPCOptions, addInterruptIpc } from "../../ipc";
import { nt } from "./nt";
import { startWatchingElement, waitForElement } from "./waitForElement";

export function getAPI(windowLoadPromise: Promise<void>) {
    windowLoadPromise.then(() => startWatchingElement());

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
            waitForElement: waitForElement,
        },
        windowLoadPromise: windowLoadPromise,
    };
}
