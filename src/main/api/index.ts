import { addInterruptIpc } from "../../ipc";
import { addInterruptWindowArgs, addInterruptWindowCreation } from "../patch";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import * as fs from "fs-extra";

export function getAPI() {
    const api: QQNTim.API.Main.API = {
        interrupt: {
            ipc: addInterruptIpc,
            windowCreation: addInterruptWindowCreation,
            windowArgs: addInterruptWindowArgs,
        },
        modules: {
            fs: fs,
        },
    };

    return api;
}
