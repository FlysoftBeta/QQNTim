import { AllUsersPlugins, PluginInjection } from "../plugin";
import { getAPI } from "./api";
import { applyScripts, loadPlugins } from "../loader";

const api = getAPI();

function shouldInject(injection: PluginInjection) {
    return injection.type == "main";
}

export function applyPlugins(allPlugins: AllUsersPlugins, uin: string = "") {
    const userPlugins = allPlugins[uin];
    if (!userPlugins) {
        console.warn(`[!Loader] 当前账户 (${uin}) 没有插件，跳过加载`);
        return false;
    }

    loadPlugins(userPlugins, shouldInject, false);
    applyScripts(api);

    return true;
}
