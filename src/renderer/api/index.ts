import { version } from "../../../package.json";
import { allPlugins, env } from "../../globalVar";
import { addInterruptIpc } from "../../ipc";
import { getCurrentNTVersion } from "../../ntVersion";
import { appApi } from "./app";
import { browserWindowApi } from "./browserWindow";
import { dialogApi } from "./dialog";
import { getVueId } from "./getVueId";
import { nt } from "./nt";
import { ntCall } from "./nt/call";
import { ntInterrupt } from "./nt/interrupt";
import { waitForElement } from "./waitForElement";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import * as fs from "fs-extra";

export const api: QQNTim.API.Renderer.API = {
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
    dialog: dialogApi,
    modules: {
        fs: fs,
    },
    utils: {
        waitForElement: waitForElement,
        getVueId: getVueId,
        ntCall: ntCall,
        ntInterrupt: ntInterrupt,
    },
    windowLoadPromise: new Promise<void>((resolve) => window.addEventListener("load", () => resolve())),
};
