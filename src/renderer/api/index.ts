import { addInterruptIpc } from "../../ipc";
import { browserwindow } from "./browserWindow";
import { nt } from "./nt";
import { ntCall } from "./nt/call";
import { startWatchingElement, waitForElement } from "./waitForElement";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import * as fs from "fs-extra";

export function getAPI(windowLoadPromise: Promise<void>) {
    windowLoadPromise.then(() => startWatchingElement());

    const api: QQNTim.API.Renderer.API = {
        interrupt: {
            ipc: addInterruptIpc,
        },
        nt: nt,
        browserwindow: browserwindow,
        modules: {
            fs: fs,
        },
        utils: {
            waitForElement: waitForElement,
            ntCall: ntCall,
        },
        windowLoadPromise: windowLoadPromise,
    };

    return api;
}
