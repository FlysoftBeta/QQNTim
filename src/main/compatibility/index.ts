import { disableCompatibilityProcessing } from "../../env";
import { loadLiteLoaderIfExists } from "./liteloader";

export function hookPostPatchElectron() {
    if (disableCompatibilityProcessing) return;
    console.log("[!Compatibility] 正在进行兼容性处理");
    loadLiteLoaderIfExists();
}
