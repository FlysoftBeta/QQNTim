import { allPlugins, env } from "../../common/global";
import { addInterruptIpc } from "../../common/ipc";
import { mountVersion } from "../../common/version";
import { appApi } from "./app";
import { browserWindowApi } from "./browserWindow";
import { dialogApi } from "./dialog";
import { getVueId } from "./getVueId";
import { nt } from "./nt";
import { ntCall } from "./nt/call";
import { ntInterrupt } from "./nt/interrupt";
import { waitForElement } from "./waitForElement";
import { windowLoadPromise } from "./windowLoadPromise";

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
            fs: require("fs"),
        },
        utils: {
            waitForElement: waitForElement,
            getVueId: getVueId,
            ntCall: ntCall,
            ntInterrupt: ntInterrupt,
        },
        windowLoadPromise: windowLoadPromise,
    };
}
