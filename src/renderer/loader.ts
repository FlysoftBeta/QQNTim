import { loadPlugins } from "../common/loader";
import { windowLoadPromise } from "./api/windowLoadPromise";
import { ipcRenderer } from "electron";
import * as fs from "fs-extra";

let scripts: [QQNTim.Plugin, string][] = [];
const stylesheets: [QQNTim.Plugin, string][] = [];

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

function shouldInject(injection: QQNTim.Plugin.Injection, page: QQNTim.Manifest.Page) {
    return injection.type == "renderer" && (!injection.pattern || injection.pattern.test(window.location.href)) && (!injection.page || injection.page.includes(page));
}

export function applyPlugins(allPlugins: QQNTim.Plugin.AllUsersPlugins, uin = "") {
    const page = detectCurrentPage();
    if (page == "about") return false;

    loadPlugins(allPlugins, uin, (injection) => shouldInject(injection, page), scripts, stylesheets);
    applyScripts();

    windowLoadPromise.then(() => applyStylesheets());

    if (uin != "") ipcRenderer.send("___!apply_plugins", uin);

    return true;
}

function applyStylesheets() {
    console.log("[!Loader] 正在注入 CSS", stylesheets);

    let element: HTMLStyleElement = document.querySelector("#qqntim_injected_styles")!;
    if (element) element.remove();

    element = document.createElement("style");
    element.id = "qqntim_injected_styles";
    element.innerHTML = stylesheets.map(([plugin, stylesheet]) => `/* ${plugin.manifest.id.replaceAll("/", "-")} - ${stylesheet.replaceAll("/", "-")} */\n${fs.readFileSync(stylesheet).toString()}`).join("\n");
    document.body.appendChild(element);
}

function applyScripts() {
    scripts = scripts.filter(([plugin, script]) => {
        try {
            const mod = require(script);
            if (mod) {
                const entry = new ((mod.default || mod) as typeof QQNTim.Entry.Renderer)();
                windowLoadPromise.then(() => entry.onWindowLoaded?.());
            }
            return false;
        } catch (reason) {
            console.error(`[!Loader] 运行此插件脚本时出现意外错误：${script}，请联系插件作者 (${plugin.manifest.author}) 解决`);
            console.error(reason);
        }
        return true;
    });
}
