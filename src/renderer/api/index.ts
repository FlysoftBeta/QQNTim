import * as fs from "fs-extra";
import { InterruptIPC, InterruptIPCOptions, addInterruptIpc } from "../../ipc";
import { nt } from "./nt";
import { startWatchingElement, waitForElement } from "./waitForElement";
import { ntCall } from "./nt/call";
import { browserwindow } from "./browserWindow";

export function getAPI(windowLoadPromise: Promise<void>) {
    windowLoadPromise.then(() => startWatchingElement());

    return {
        interrupt: {
            ipc: (func: InterruptIPC, options?: InterruptIPCOptions) =>
                addInterruptIpc(func, options),
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
