import { QQNTim } from "@flysoftbeta/qqntim-typings";
import { ipcRenderer } from "electron";

class DialogAPI implements QQNTim.API.Renderer.DialogAPI {
    async confirm(message = "") {
        const res = await this.messageBox({ message, buttons: ["确定", "取消"], defaultId: 0, type: "question" });
        return res.response == 0;
    }

    async alert(message = "") {
        await this.messageBox({ message, buttons: ["确定"], defaultId: 0, type: "info" });
        return;
    }

    messageBox(options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue> {
        return ipcRenderer.invoke("___!dialog", "showMessageBox", options);
    }

    openDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
        return ipcRenderer.invoke("___!dialog", "showOpenDialog", options);
    }

    saveDialog(options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> {
        return ipcRenderer.invoke("___!dialog", "showSaveDialog", options);
    }
}

export const dialogApi = new DialogAPI();
