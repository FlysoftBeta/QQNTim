import { allPlugins, env } from "../../common/global";
import { addInterruptIpc } from "../../common/ipc";
import { defineModules } from "../../common/patch";
import { mountVersion } from "../../common/version";
import { appApi } from "./app";
import { browserWindowApi } from "./browserWindow";
import { dialogApi } from "./dialog";
import { getVueId } from "./getVueId";
import { nt } from "./nt";
import { ntCall } from "./nt/call";
import { waitForElement } from "./waitForElement";
import { windowLoadPromise } from "./windowLoadPromise";
import * as fs from "fs-extra";

export let api: typeof QQNTim.API.Renderer;

export function initAPI() {
    mountVersion();
    nt.init();

    api = {
        allPlugins: allPlugins,
        env: env,
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
        defineModules: defineModules,
        utils: {
            waitForElement: waitForElement,
            getVueId: getVueId,
            ntCall: ntCall,
        },
        windowLoadPromise: windowLoadPromise,
    };

    defineModules({ "qqntim/renderer": api });
}
