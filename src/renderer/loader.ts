import * as electron from "electron";
import * as path from "path";
import * as fs from "fs-extra";
import type { Plugin } from "../plugin";
import { addInterruptIpc } from "./patch";
import type { InterruptIPC } from "../ipc";
import { getAPI } from "./api";

const s = path.sep;

const stylesheets: string[] = [];
export let plugins: Record<string, Plugin> = {};

const windowLoadPromise = new Promise<void>((resolve) =>
    window.addEventListener("load", () => resolve())
);
const api = getAPI(windowLoadPromise);

function detectCurrentPage() {
    const url = window.location.href;
    if (url.includes("login")) {
        return "login";
    } else if (url.includes("main")) {
        return "main";
    } else if (url.includes("chat")) {
        return "chat";
    } else if (url.includes("setting")) {
        return "settings";
    } else if (url.includes("about")) {
        return "about";
    } else {
        return "others";
    }
}

export function setPlugins(newPlugins: Record<string, Plugin>) {
    const page = detectCurrentPage();
    if (page == "about") return;

    for (const id in newPlugins) {
        if (plugins[id]) continue;
        const plugin = newPlugins[id];
        if (!plugin.loaded) continue;
        plugins[id] = plugin;
        console.log(`[!Loader] 正在加载插件：${id}`);

        const scripts: string[] = [];
        plugin.injections.forEach((injection) => {
            if (
                injection.type != "renderer" ||
                (injection.pattern && !injection.pattern.test(window.location.href)) ||
                (injection.page && !injection.page.includes(page))
            )
                return;
            injection.stylesheet &&
                stylesheets.push(
                    fs.readFileSync(`${plugin.dir}${s}${injection.stylesheet}`).toString()
                );
            injection.script && scripts.push(`${plugin.dir}${s}${injection.script}`);
        });
        scripts.forEach((script) => {
            try {
                require(script)(api);
            } catch (reason) {
                console.error(
                    `[!Loader] 运行此插件脚本时出现意外错误：${script}，请联系插件作者解决`
                );
                console.error(reason);
            }
        });
    }
    loadStylesheet();
}

async function loadStylesheet() {
    console.log(`[!Loader] 正在注入 CSS`, stylesheets);

    await windowLoadPromise;

    let element: HTMLStyleElement = document.querySelector("#qqntim_injected_styles")!;
    if (element) element.remove();

    element = document.createElement("style");
    element.id = "qqntim_injected_styles";
    element.innerText = stylesheets.join("\n");
    document.body.appendChild(element);
}
