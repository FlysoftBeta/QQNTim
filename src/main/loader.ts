import { loadPlugins } from "../loader";
import { AllUsersPlugins, Plugin, PluginInjection } from "../plugins";
import { getAPI } from "./api";
import { QQNTim } from "@flysoftbeta/qqntim-typings";

let scripts: [Plugin, string][] = [];
const api = getAPI();

function shouldInject(injection: PluginInjection) {
    return injection.type == "main";
}

export function applyPlugins(allPlugins: AllUsersPlugins, uin = "") {
    loadPlugins(allPlugins, uin, shouldInject, scripts);
    applyScripts();

    return true;
}

function applyScripts() {
    scripts = scripts.filter(([plugin, script]) => {
        try {
            const mod = require(script);
            if (mod)
                if (plugin.manifest.manifestVersion == "2.0") {
                    new (mod.default as typeof QQNTim.Entry.Main)(api);
                } else mod(api);

            return false;
        } catch (reason) {
            console.error(`[!Loader] 运行此插件脚本时出现意外错误：${script}，请联系插件作者 (${plugin.manifest.author}) 解决`);
            console.error(reason);
        }
        return true;
    });
}
