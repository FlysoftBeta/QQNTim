import { ipcRenderer } from "electron";

class BrowserWindowApi {
    setSize(width: number, height: number) {
        ipcRenderer.sendSync(
            "___!browserwindow_api",
            {
                eventName: "QQNTIM_BROWSERWINDOW_API",
            },
            ["setSize", [width, height]]
        );
    }

    setMinimumSize(width: number, height: number) {
        ipcRenderer.sendSync(
            "___!browserwindow_api",
            {
                eventName: "QQNTIM_BROWSERWINDOW_API",
            },
            ["setMinimumSize", [width, height]]
        );
    }
}

export const browserwindow = new BrowserWindowApi();
