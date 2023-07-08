import { applyScripts, applyStylesheets, loadPlugins } from "../loader";
import { AllUsersPlugins, Page, PageWithAbout, PluginInjection } from "../plugin";
import { getAPI } from "./api";

const windowLoadPromise = new Promise<void>((resolve) => window.addEventListener("load", () => resolve()));
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
    return injection.type == "renderer" && (!injection.pattern || injection.pattern.test(window.location.href)) && (!injection.page || injection.page.includes(page));
}

export function applyPlugins(allPlugins: AllUsersPlugins, uin = "") {
    const page = detectCurrentPage();
    if (page == "about") return false;

    loadPlugins(allPlugins, uin, (injection) => shouldInject(injection, page), true);
    applyScripts(api);
    windowLoadPromise.then(() => applyStylesheets());

    return true;
}
