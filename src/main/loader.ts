import { applyScripts, loadPlugins } from "../loader";
import { AllUsersPlugins, PluginInjection } from "../plugin";
import { getAPI } from "./api";

const api = getAPI();

function shouldInject(injection: PluginInjection) {
    return injection.type == "main";
}

export function applyPlugins(allPlugins: AllUsersPlugins, uin = "") {
    loadPlugins(allPlugins, uin, shouldInject, false);
    applyScripts(api);

    return true;
}
