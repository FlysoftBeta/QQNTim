import { ipcRenderer } from "electron";

class AppAPI implements QQNTim.API.Renderer.AppAPI {
    relaunch() {
        ipcRenderer.sendSync("___!app_api", ["relaunch", []]);
        this.quit();
    }

    quit() {
        ipcRenderer.sendSync("___!app_api", ["quit", []]);
    }

    exit() {
        ipcRenderer.sendSync("___!app_api", ["exit", []]);
    }
}

export const appApi = new AppAPI();
