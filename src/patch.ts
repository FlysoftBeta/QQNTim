import * as path from "path";
import { Module } from "module";
import { plugins } from "./loader";

const s = path.sep;

type IPCArgs = [{ type: string; eventName: string; callbackId: string }, any[]];
export type InterruptIPC = (args: IPCArgs) => boolean | undefined;

const interruptIpcs: InterruptIPC[] = [];

export function patchElectron() {
    let patchedElectron: typeof Electron.CrossProcessExports;
    const loadBackend = (Module as any)._load;
    (Module as any)._load = (request: string, parent: NodeModule, isMain: boolean) => {
        const loadedModule = loadBackend(
            request,
            parent,
            isMain
        ) as typeof Electron.CrossProcessExports;
        if (request == "electron") {
            if (patchedElectron) return patchedElectron;
            const ipcMain = {
                ...loadedModule.ipcMain,
                on(channel: string, listener: (event: any, ...args: any[]) => void) {
                    loadedModule.ipcMain.on(channel, (event: any, ...args: IPCArgs) => {
                        for (const func of interruptIpcs) {
                            const ret = func(args);
                            if (ret == false) return;
                        }
                        if (
                            args[0].eventName == "ns-LoggerApi-1" ||
                            args[0].eventName == "ns-LoggerApi-2"
                        )
                            return;

                        listener(event, ...args);
                    });
                },
            };
            Object.setPrototypeOf(ipcMain, loadedModule.ipcMain);
            const BrowserWindow = function (
                args: Electron.BrowserWindowConstructorOptions
            ) {
                const win = new loadedModule.BrowserWindow({
                    ...args,
                    webPreferences: {
                        ...args.webPreferences,
                        preload: `${__dirname}${s}qqntim-renderer.js`,
                        devTools: true,
                        webSecurity: false,
                        nodeIntegration: true,
                        nodeIntegrationInSubFrames: true,
                        sandbox: false,
                    },
                });
                win.webContents.on("ipc-message-sync", (_, channel) => {
                    if (channel == "___!boot") {
                        _.returnValue = {
                            plugins: plugins,
                            resourceDir: path.dirname(args.webPreferences?.preload!),
                        };
                    }
                });
                return win;
            };
            Object.setPrototypeOf(BrowserWindow, loadedModule.BrowserWindow);
            const Menu = {
                ...loadedModule.Menu,
                setApplicationMenu() {
                    const menu = loadedModule.Menu.buildFromTemplate([
                        {
                            role: "toggleDevTools",
                            accelerator: "F12",
                        },
                        { role: "reload", accelerator: "F5" },
                    ]);
                    loadedModule.Menu.setApplicationMenu(menu);
                },
            };
            Object.setPrototypeOf(Menu, loadedModule.Menu);
            patchedElectron = {
                ...loadedModule,
                BrowserWindow: BrowserWindow as any,
                Menu: Menu as any,
                ipcMain: ipcMain as any,
            };
            return patchedElectron;
        }
        return loadedModule;
    };
}

export function addInterruptIpc(newInterruptIpc: InterruptIPC) {
    interruptIpcs.push(newInterruptIpc);
}
