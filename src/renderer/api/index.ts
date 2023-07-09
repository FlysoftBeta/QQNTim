import { version } from "../../../package.json";
import { allPlugins, env } from "../../globalVar";
import { addInterruptIpc } from "../../ipc";
import { getCurrentNTVersion } from "../../ntVersion";
import { appApi } from "./app";
import { browserWindowApi } from "./browserWindow";
import { getVueId } from "./getVueId";
import { nt } from "./nt";
import { ntCall } from "./nt/call";
import { startWatchingElement, waitForElement } from "./waitForElement";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import * as fs from "fs-extra";

export function getAPI(windowLoadPromise: Promise<void>) {
    windowLoadPromise.then(() => startWatchingElement());

    const api: QQNTim.API.Renderer.API = {
        allPlugins: allPlugins,
        env: env,
        version: version,
        ntVersion: getCurrentNTVersion(),
        interrupt: {
            ipc: addInterruptIpc,
        },
        nt: nt,
        browserWindow: browserWindowApi,
        app: appApi,
        modules: {
            fs: fs,
        },
        utils: {
            waitForElement: waitForElement,
            getVueId: getVueId,
            ntCall: ntCall,
        },
        windowLoadPromise: windowLoadPromise,
    };

    return api;
}
