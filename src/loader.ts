import * as path from "path";
import * as fs from "fs-extra";
import {
    LoadedPlugins,
    Plugin,
    PluginInjection,
    PluginInjectionRenderer,
    UserPlugins,
} from "./plugin";

const s = path.sep;

const loadedPlugins: LoadedPlugins = {};

const stylesheets: [Plugin, string][] = [],
    scripts: [Plugin, string][] = [];

export function applyScripts(api: any) {
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

export function applyStylesheets() {
    console.log(`[!Loader] 正在注入 CSS`, stylesheets);

    let element: HTMLStyleElement = document.querySelector("#qqntim_injected_styles")!;
    if (element) element.remove();

    element = document.createElement("style");
    element.id = "qqntim_injected_styles";
    element.innerHTML = stylesheets
        .map(([_, stylesheet]) => fs.readFileSync(stylesheet).toString())
        .join("\n");
    document.body.appendChild(element);
}

export function loadPlugins(
    userPlugins: UserPlugins,
    shouldInject: (injection: PluginInjection) => boolean,
    injectStylesheets: boolean
) {
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
}
