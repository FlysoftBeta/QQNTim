import * as path from "path";
import * as fs from "fs-extra";
import {
    AllUsersPlugins,
    LoadedPlugins,
    Plugin,
    PluginInjection,
    PluginInjectionRenderer,
} from "./plugin";

const s = path.sep;

const loadedPlugins: LoadedPlugins = {};

let stylesheets: [Plugin, string][] = [],
    scripts: [Plugin, string][] = [];

export function applyScripts(api: any) {
    scripts = scripts.filter(([plugin, script]) => {
        try {
            require(script)(api);
            return false;
        } catch (reason) {
            console.error(
                `[!Loader] 运行此插件脚本时出现意外错误：${script}，请联系插件作者 (${plugin.manifest.author}) 解决`
            );
            console.error(reason);
        }
        return true;
    });
}

export function applyStylesheets() {
    console.log(`[!Loader] 正在注入 CSS`, stylesheets);

    let element: HTMLStyleElement = document.querySelector("#qqntim_injected_styles")!;
    if (element) element.remove();

    element = document.createElement("style");
    element.id = "qqntim_injected_styles";
    element.innerHTML = stylesheets
        .map(
            ([plugin, stylesheet]) => `/* ${plugin.manifest.id.replaceAll(
                "/",
                "-"
            )} - ${stylesheet.replaceAll("/", "-")} */
${fs.readFileSync(stylesheet).toString()}`
        )
        .join("\n");
    document.body.appendChild(element);
}

function getUserPlugins(allPlugins: AllUsersPlugins, uin: string) {
    const userPlugins = allPlugins[uin];
    if (!userPlugins) {
        console.warn(`[!Loader] 账户 (${uin}) 没有插件，跳过加载`);
        return;
    }
    if (uin != "") console.log(`[!Loader] 正在为账户 (${uin}) 加载插件`);
    else console.log(`[!Loader] 正在为所有账户加载插件`);
    return userPlugins;
}

export function loadPlugins(
    allPlugins: AllUsersPlugins,
    uin: string,
    shouldInject: (injection: PluginInjection) => boolean,
    injectStylesheets: boolean
) {
    const userPlugins = getUserPlugins(allPlugins, uin);
    if (!userPlugins) return false;

    for (const id in userPlugins) {
        if (loadedPlugins[id]) continue;
        const plugin = userPlugins[id];
        if (!plugin.loaded) continue;
        loadedPlugins[id] = plugin;
        console.log(`[!Loader] 正在加载插件：${id}`);

        plugin.injections.forEach((injection) => {
            const rendererInjection = injection as PluginInjectionRenderer;
            if (!shouldInject(injection)) return;
            injectStylesheets &&
                rendererInjection.stylesheet &&
                stylesheets.push([
                    plugin,
                    `${plugin.dir}${s}${rendererInjection.stylesheet}`,
                ]);
            injection.script &&
                scripts.push([plugin, `${plugin.dir}${s}${injection.script}`]);
        });
    }

    return true;
}
