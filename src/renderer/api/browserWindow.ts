import { QQNTim } from "@flysoftbeta/qqntim-typings";
import { ipcRenderer } from "electron";

class BrowserWindowAPI implements QQNTim.API.Renderer.BrowserWindowAPI {
    setSize(width: number, height: number) {
        ipcRenderer.sendSync(
            "___!browserwindow_api",
            {
                eventName: "QQNTIM_BROWSERWINDOW_API",
            },
            ["setSize", [width, height]],
        );
    }

    setMinimumSize(width: number, height: number) {
        ipcRenderer.sendSync(
            "___!browserwindow_api",
            {
                eventName: "QQNTIM_BROWSERWINDOW_API",
            },
            ["setMinimumSize", [width, height]],
        );
    }
}

export const browserWindowApi = new BrowserWindowAPI();
