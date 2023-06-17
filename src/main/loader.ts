import * as path from "path";
import * as electron from "electron";
import * as fs from "fs-extra";
import { Plugin } from "../plugin";
import { addInterruptWindowCreation } from "./patch";
import {
    addInterruptIpc,
    InterruptIPCOptions,
    InterruptIPC,
    InterruptWindowCreation,
} from "../ipc";

const s = path.sep;

export let plugins: Record<string, Plugin> = {};

export function setPlugins(newPlugins: Record<string, Plugin>) {
    for (const id in newPlugins) {
        if (plugins[id]) continue;
        const plugin = newPlugins[id];
        if (!plugin.loaded) continue;
        plugins[id] = plugin;
        console.log(`[!Loader] 正在加载插件：${id}`);

        const scripts: string[] = [];
        plugin.injections.forEach((injection) => {
            if (injection.type != "main") return;
            injection.script && scripts.push(`${plugin.dir}${s}${injection.script}`);
        });
        scripts.forEach((script) => {
            try {
                require(script)({
                    interrupt: {
                        ipc: (func: InterruptIPC, options?: InterruptIPCOptions) =>
                            addInterruptIpc(func, options),
                        windowCreation: (func: InterruptWindowCreation) =>
                            addInterruptWindowCreation(func),
                    },
                    modules: {
                        electron: electron,
                        fs: fs,
                    },
                });
            } catch (reason) {
                console.error(
                    `[!Loader] 运行此插件脚本时出现意外错误：${script}，请联系插件作者解决`
                );
                console.error(reason);
            }
        });
    }
}

addInterruptIpc((args) => {
    console.log(JSON.stringify(args));
});
