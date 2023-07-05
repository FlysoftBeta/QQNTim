import { AllUsersPlugins, PluginInjection } from "../plugin";
import { getAPI } from "./api";
import { applyScripts, loadPlugins } from "../loader";

const api = getAPI();

function shouldInject(injection: PluginInjection) {
    return injection.type == "main";
}

export function applyPlugins(allPlugins: AllUsersPlugins, uin: string = "") {
    loadPlugins(allPlugins, uin, shouldInject, false);
    applyScripts(api);

    return true;
}
