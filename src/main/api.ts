import { env } from "../common/global";
import { addInterruptIpc } from "../common/ipc";
import { mountVersion } from "../common/version";
import { addInterruptWindowArgs, addInterruptWindowCreation } from "./patch";
import { plugins } from "./plugins";

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
        modules: {
            fs: require("fs-extra"),
        },
    };
}
