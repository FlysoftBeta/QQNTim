import { AllUsersPlugins, Page, PageWithAbout, PluginInjection } from "../plugin";
import { getAPI } from "./api";
import { applyScripts, applyStylesheets, loadPlugins } from "../loader";

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

function shouldInject(injection: PluginInjection, page: Page) {
    return (
        injection.type == "renderer" &&
        (!injection.pattern || injection.pattern.test(window.location.href)) &&
        (!injection.page || injection.page.includes(page))
    );
}

export function applyPlugins(allPlugins: AllUsersPlugins, uin: string = "") {
    const userPlugins = allPlugins[uin];
    if (!userPlugins) {
        console.warn(`[!Loader] 账户 (${uin}) 没有插件，跳过加载`);
        return false;
    }
    if (uin != "") console.log(`[!Loader] 正在为账户 (${uin}) 加载插件`);
    else console.log(`[!Loader] 正在为所有账户加载插件`);

    const page = detectCurrentPage();
    if (page == "about") return false;

    loadPlugins(userPlugins, (injection) => shouldInject(injection, page), true);
    applyScripts(api);
    windowLoadPromise.then(() => applyStylesheets());

    return true;
}
