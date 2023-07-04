import * as path from "path";
import * as fs from "fs-extra";
import { AllUsersPlugins, LoadedPlugins, PageWithAbout, UserPlugins } from "../plugin";
import { getAPI } from "./api";

const s = path.sep;

const stylesheets: string[] = [];
let loadedPlugins: LoadedPlugins = {};

const windowLoadPromise = new Promise<void>((resolve) =>
    window.addEventListener("load", () => resolve())
);
const api = getAPI(windowLoadPromise);

function detectCurrentPage(): PageWithAbout {
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

function loadPlugins(userPlugins: UserPlugins) {
    const page = detectCurrentPage();
    if (page == "about") return false;

    for (const id in userPlugins) {
        if (loadedPlugins[id]) continue;
        const plugin = userPlugins[id];
        if (!plugin.loaded) continue;
        loadedPlugins[id] = plugin;
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
                    `[!Loader] 运行此插件脚本时出现意外错误：${script}，请联系插件作者 (${plugin.manifest.author}) 解决`
                );
                console.error(reason);
            }
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
    applyStylesheets();

    return true;
}

async function applyStylesheets() {
    console.log(`[!Loader] 正在注入 CSS`, stylesheets);

    await windowLoadPromise;

    let element: HTMLStyleElement = document.querySelector("#qqntim_injected_styles")!;
    if (element) element.remove();

    element = document.createElement("style");
    element.id = "qqntim_injected_styles";
    element.innerText = stylesheets.join("\n");
    document.body.appendChild(element);
}
