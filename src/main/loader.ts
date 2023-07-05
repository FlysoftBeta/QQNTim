import * as path from "path";
import {
    AllUsersPlugins,
    LoadedPlugins,
    UserPlugins,
    Plugin,
    PluginInjection,
    PluginInjectionMain,
} from "../plugin";
import { getAPI } from "./api";
import { applyScripts } from "../loader";

const s = path.sep;

const scripts: [Plugin, string][] = [];
let loadedPlugins: LoadedPlugins = {};

const api = getAPI();

function shouldInject(injection: PluginInjection) {
    return injection.type != "main";
}

function loadPlugins(userPlugins: UserPlugins) {
    for (const id in userPlugins) {
        if (loadedPlugins[id]) continue;
        const plugin = userPlugins[id];
        if (!plugin.loaded) continue;
        loadedPlugins[id] = plugin;
        console.log(`[!Loader] 正在加载插件：${id}`);

        plugin.injections.forEach((_injection) => {
            const injection = _injection as PluginInjectionMain;
            if (!shouldInject(injection)) return;
            injection.script &&
                scripts.push([plugin, `${plugin.dir}${s}${injection.script}`]);
        });
    }
}

export function applyPlugins(allPlugins: AllUsersPlugins, uin: string = "") {
    const userPlugins = allPlugins[uin];
    if (!userPlugins) {
        console.warn(`[!Loader] 当前账户 (${uin}) 没有插件，跳过加载`);
        return false;
    }

    loadPlugins(userPlugins);
    applyScripts(scripts, api);

    return true;
}
