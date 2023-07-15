import { env } from "../common/global";
import { debuggerOrigin, webContentsId } from "./main";

export function attachDebugger() {
    if (!env.config.useNativeDevTools)
        window.addEventListener("DOMContentLoaded", () => {
            // 将标题临时改为当前 WebContents ID 用于标识此窗口
            const oldTitle = document.title;
            document.title = webContentsId;
            window.addEventListener("load", () => {
                document.title = oldTitle == "" ? "QQ" : oldTitle;
            });

            const scriptTag = document.createElement("script");
            scriptTag.src = `${debuggerOrigin}/target.js`;
            document.head.appendChild(scriptTag);
        });
}
