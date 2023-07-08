import { env } from "../../config";
import { loadLiteLoaderIfExists } from "./liteloader";

export function hookPostPatchElectron() {
    if (env.disableCompatibilityProcessing) return;
    console.log("[!Compatibility] 正在进行兼容性处理");
    loadLiteLoaderIfExists();
}
