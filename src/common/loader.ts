import { s } from "./sep";

const loadedPlugins: QQNTim.Plugin.LoadedPlugins = {};

function getUserPlugins(allPlugins: QQNTim.Plugin.AllUsersPlugins, uin: string) {
    const userPlugins = allPlugins[uin];
    if (!userPlugins) {
        console.warn(`[!Loader] 账户 (${uin}) 没有插件，跳过加载`);
        return;
    }
    if (uin != "") console.log(`[!Loader] 正在为账户 (${uin}) 加载插件`);
    else console.log("[!Loader] 正在为所有账户加载插件");
    return userPlugins;
}

export function loadPlugins(allPlugins: QQNTim.Plugin.AllUsersPlugins, uin: string, shouldInject: (injection: QQNTim.Plugin.Injection) => boolean, scripts: [QQNTim.Plugin, string][], stylesheets?: [QQNTim.Plugin, string][]) {
    const userPlugins = getUserPlugins(allPlugins, uin);
    if (!userPlugins) return false;

    for (const id in userPlugins) {
        if (loadedPlugins[id]) continue;
        const plugin = userPlugins[id];
        if (!plugin.loaded) continue;
        loadedPlugins[id] = plugin;
        console.log(`[!Loader] 正在加载插件：${id}`);

        plugin.injections.forEach((injection) => {
            const rendererInjection = injection as QQNTim.Plugin.InjectionRenderer;
            if (!shouldInject(injection)) return;
            stylesheets && rendererInjection.stylesheet && stylesheets.push([plugin, `${plugin.dir}${s}${rendererInjection.stylesheet}`]);
            injection.script && scripts.push([plugin, `${plugin.dir}${s}${injection.script}`]);
        });
    }

    return true;
}
