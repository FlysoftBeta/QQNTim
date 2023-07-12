import { env } from "../../globalVar";
import { loadLiteLoaderIfExists } from "./liteloader";

export function hookAfterPatchElectron() {
    if (env.config.disableCompatibilityProcessing) return;
    console.log("[!Compatibility] 正在进行兼容性处理");
    loadLiteLoaderIfExists();
    env.config.pluginLoaders.map((loader) => require(loader));
}
