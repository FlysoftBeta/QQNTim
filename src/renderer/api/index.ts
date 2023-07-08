import { InterruptIPC, InterruptIPCOptions, addInterruptIpc } from "../../ipc";
import { browserwindow } from "./browserWindow";
import { nt } from "./nt";
import { ntCall } from "./nt/call";
import { startWatchingElement, waitForElement } from "./waitForElement";
import * as fs from "fs-extra";

export function getAPI(windowLoadPromise: Promise<void>) {
    windowLoadPromise.then(() => startWatchingElement());

    return {
        interrupt: {
            ipc: (func: InterruptIPC, options?: InterruptIPCOptions) => addInterruptIpc(func, options),
        },
        nt: nt,
        window: browserwindow,
        modules: {
            fs: fs,
        },
        utils: {
            waitForElement: waitForElement,
            ntCall: ntCall,
        },
        windowLoadPromise: windowLoadPromise,
    };
}
