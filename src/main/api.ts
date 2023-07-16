import { env } from "../common/global";
import { addInterruptIpc } from "../common/ipc";
import { defineModules } from "../common/patch";
import { mountVersion } from "../common/version";
import { addInterruptWindowArgs, addInterruptWindowCreation } from "./patch";
import { plugins } from "./plugins";
import * as fs from "fs-extra";

export let api: typeof QQNTim.API.Main;

export function initAPI() {
    mountVersion();

    api = {
        allPlugins: plugins,
        env: env,
        interrupt: {
            ipc: addInterruptIpc,
            windowCreation: addInterruptWindowCreation,
            windowArgs: addInterruptWindowArgs,
        },
        defineModules: defineModules,
        modules: {
            fs: fs,
        },
    };

    defineModules({ "qqntim/main": api });
}
