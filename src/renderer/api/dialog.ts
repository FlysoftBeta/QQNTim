import { QQNTim } from "@flysoftbeta/qqntim-typings";
import { ipcRenderer } from "electron";

class DialogAPI implements QQNTim.API.Renderer.DialogAPI {
    private api<R, T>(method: string, options: T): Promise<R> {
        return ipcRenderer.invoke(
            "___!dialog",
            {
                eventName: "QQNTIM_DIALOG_API",
            },
            method,
            options,
        ) as Promise<R>;
    }

    async confirm(message = "") {
        const res = await this.messageBox({ message, buttons: ["确定", "取消"], defaultId: 0, type: "question" });
        return res.response == 0;
    }

    async alert(message = "") {
        await this.messageBox({ message, buttons: ["确定"], defaultId: 0, type: "info" });
        return;
    }

    messageBox(options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue> {
        return this.api("showMessageBox", options);
    }

    openDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
        return this.api("showOpenDialog", options);
    }

    saveDialog(options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> {
        return this.api("showSaveDialog", options);
    }
}

export const dialogApi = new DialogAPI();
