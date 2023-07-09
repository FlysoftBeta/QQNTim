import { env } from "../globalVar";

export function attachDebugger(debuggerId: string, debuggerOrigin: string) {
    if (!env.config.useNativeDevTools)
        window.addEventListener("DOMContentLoaded", () => {
            const oldTitle = document.title;
            document.title = debuggerId;
            window.addEventListener("load", () => {
                document.title = oldTitle == "" ? "QQ" : oldTitle;
            });

            const scriptTag = document.createElement("script");
            scriptTag.src = `${debuggerOrigin}/target.js`;
            document.head.appendChild(scriptTag);
        });
}
