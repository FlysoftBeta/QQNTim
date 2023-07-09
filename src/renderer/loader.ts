import { loadPlugins } from "../loader";
import { AllUsersPlugins, Plugin, PluginInjection } from "../plugins";
import { getAPI } from "./api";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import * as fs from "fs-extra";

const windowLoadPromise = new Promise<void>((resolve) => window.addEventListener("load", () => resolve()));
const api = getAPI(windowLoadPromise);
let scripts: [Plugin, string][] = [];
const stylesheets: [Plugin, string][] = [];

function detectCurrentPage(): QQNTim.Manifest.PageWithAbout {
    const url = window.location.href;
    for (const [keyword, name] of [
        ["login", "login"],
        ["main", "main"],
        ["chat", "chat"],
        ["setting", "settings"],
        ["about", "about"],
    ] as [string, QQNTim.Manifest.PageWithAbout][]) {
        if (url.includes(keyword)) return name;
    }
    return "others";
}

function shouldInject(injection: PluginInjection, page: QQNTim.Manifest.Page) {
    return injection.type == "renderer" && (!injection.pattern || injection.pattern.test(window.location.href)) && (!injection.page || injection.page.includes(page));
}

export function applyPlugins(allPlugins: AllUsersPlugins, uin = "") {
    const page = detectCurrentPage();
    if (page == "about") return false;

    loadPlugins(allPlugins, uin, (injection) => shouldInject(injection, page), scripts, stylesheets);
    applyScripts();

    windowLoadPromise.then(() => applyStylesheets());

    return true;
}

function applyStylesheets() {
    console.log("[!Loader] 正在注入 CSS", stylesheets);

    let element: HTMLStyleElement = document.querySelector("#qqntim_injected_styles")!;
    if (element) element.remove();

    element = document.createElement("style");
    element.id = "qqntim_injected_styles";
    element.innerHTML = stylesheets
        .map(
            ([plugin, stylesheet]) => `/* ${plugin.manifest.id.replaceAll("/", "-")} - ${stylesheet.replaceAll("/", "-")} */
${fs.readFileSync(stylesheet).toString()}`,
        )
        .join("\n");
    document.body.appendChild(element);
}

function applyScripts() {
    scripts = scripts.filter(([plugin, script]) => {
        try {
            const mod = require(script);
            if (mod)
                if (plugin.manifest.manifestVersion == "2.0") {
                    const entry = new (mod.default as typeof QQNTim.Entry.Renderer)(api);
                    windowLoadPromise.then(() => entry.onWindowLoaded());
                } else mod(api);

            return false;
        } catch (reason) {
            console.error(`[!Loader] 运行此插件脚本时出现意外错误：${script}，请联系插件作者 (${plugin.manifest.author}) 解决`);
            console.error(reason);
        }
        return true;
    });
}
