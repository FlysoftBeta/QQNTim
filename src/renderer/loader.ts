import * as electron from "electron";
import * as path from "path";
import * as fs from "fs-extra";
import { readFileSync } from "fs-extra";
import type { Plugin } from "../plugins";
import { InterruptIPC, addInterruptIpc } from "./patch";

const s = path.sep;

const stylesheets: string[] = [],
    waitForElementSelectors: [string, (element: HTMLElement) => void][] = [];
export let plugins: Record<string, Plugin> = {};

const windowLoadPromise = new Promise<void>((resolve) =>
    window.addEventListener("load", () => resolve())
);

const refreshWaitForElementStatus = () => {
    waitForElementSelectors.forEach((item, idx) => {
        const ele = document.querySelector<HTMLElement>(item[0]);
        if (ele) {
            item[1](ele);
            waitForElementSelectors.splice(idx);
        }
    });
};
windowLoadPromise.then(() => {
    new MutationObserver(() => refreshWaitForElementStatus()).observe(document.body, {
        childList: true,
        subtree: true,
    });
});

function detectCurrentPage() {
    const url = window.location.href;
    if (url.includes("login")) {
        return "login";
    } else if (url.includes("main")) {
        return "main";
    } else if (url.includes("setting")) {
        return "settings";
    } else {
        return "others";
    }
}

export function setPlugins(newPlugins: Record<string, Plugin>) {
    for (const id in newPlugins) {
        if (plugins[id]) continue;
        const plugin = newPlugins[id];
        plugins[id] = plugin;
        console.log("Loading plugin: " + id);

        const page = detectCurrentPage();
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
                    readFileSync(`${plugin.dir}${s}${injection.stylesheet}`).toString()
                );
            injection.script && scripts.push(`${plugin.dir}${s}${injection.script}`);
        });
        scripts.forEach((script) => {
            try {
                require(script)({
                    ipc: {
                        interruptIpc: (newInterruptIpc: InterruptIPC) =>
                            addInterruptIpc(newInterruptIpc),
                    },
                    modules: {
                        electron: electron,
                        fs: fs,
                    },
                    utils: {
                        waitForElement: (selector: string) => {
                            return new Promise<HTMLElement>((resolve) => {
                                waitForElementSelectors.push([
                                    selector,
                                    (element) => {
                                        resolve(element);
                                    },
                                ]);
                                refreshWaitForElementStatus();
                            });
                        },
                    },
                    onLoad: (cb: Function) => {
                        windowLoadPromise.then(() => cb());
                    },
                });
            } catch (reason) {
                console.error(`Failed to run plugin script: ${script}`, reason);
            }
        });
    }
    loadStylesheet();
}

async function loadStylesheet() {
    await windowLoadPromise;

    let element: HTMLStyleElement = document.querySelector("#qqntim_injected_styles")!;
    if (element) element.remove();

    element = document.createElement("style");
    element.id = "qqntim_injected_styles";
    element.innerText = stylesheets.join("\n");
    document.body.appendChild(element);
}