import { Plugin } from "./plugin";

export function applyScripts(scripts: [Plugin, string][], api: any) {
    scripts.forEach(([plugin, script]) => {
        try {
            require(script)(api);
        } catch (reason) {
            console.error(
                `[!Loader] 运行此插件脚本时出现意外错误：${script}，请联系插件作者 (${plugin.manifest.author}) 解决`
            );
            console.error(reason);
        }
    });
}
