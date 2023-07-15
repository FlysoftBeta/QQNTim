import { env } from "../common/global";
import { existsSync } from "fs-extra";
import { resolve } from "path";

export function loadCustomLoaders() {
    if (env.config.disableCompatibilityProcessing) return;
    console.log("[!Compatibility] 正在进行兼容性处理");
    env.config.pluginLoaders.map((loader: string) => {
        const path = resolve(__dirname, "..", loader);
        if (existsSync(path)) require(path);
    });
}
