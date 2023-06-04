import * as path from "path";
import type { Plugin } from "./plugins";
import { InterruptIPC, addInterruptIpc } from "./patch";

const s = path.sep;

export let plugins: Record<string, Plugin> = {};

export function setPlugins(newPlugins: Record<string, Plugin>) {
    for (const id in newPlugins) {
        if (plugins[id]) continue;
        const plugin = newPlugins[id];
        plugins[id] = plugin;

        const scripts: string[] = [];
        plugin.injections.forEach((injection) => {
            if (injection.type != "main") return;
            injection.script && scripts.push(`${plugin.dir}${s}${injection.script}`);
        });
        scripts.forEach((script) => {
            try {
                require(script)({
                    ipc: {
                        interruptIpc: (newInterruptIpc: InterruptIPC) =>
                            addInterruptIpc(newInterruptIpc),
                    },
                });
            } catch (reason) {
                console.error(`Failed to run plugin script: ${script}`, reason);
            }
        });
    }
}
