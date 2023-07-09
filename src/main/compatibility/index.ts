import { env } from "../../config";
import { loadLiteLoaderIfExists } from "./liteloader";

export function hookAfterPatchElectron() {
    if (env.disableCompatibilityProcessing) return;
    console.log("[!Compatibility] 正在进行兼容性处理");
    loadLiteLoaderIfExists();
}
