import { ipcRenderer } from "electron";

class AppAPI {
    relaunch() {
        ipcRenderer.sendSync(
            "___!app_api",
            {
                eventName: "QQNTIM_APP_API",
            },
            ["relaunch", []],
        );
        this.quit();
    }

    quit() {
        ipcRenderer.sendSync(
            "___!app_api",
            {
                eventName: "QQNTIM_APP_API",
            },
            ["quit", []],
        );
    }

    exit() {
        ipcRenderer.sendSync(
            "___!app_api",
            {
                eventName: "QQNTIM_APP_API",
            },
            ["exit", []],
        );
    }
}

export const appApi = new AppAPI();
