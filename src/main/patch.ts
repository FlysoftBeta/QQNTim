import * as path from "path";
import { Module } from "module";
import { plugins } from "./loader";
import { InterruptWindowCreation, IPCArgs, handleIpc } from "../ipc";

const s = path.sep;

const interruptWindowCreation: InterruptWindowCreation[] = [];

function patchBrowserWindow(BrowserWindow: typeof Electron.BrowserWindow) {
    const func = function (options: Electron.BrowserWindowConstructorOptions) {
        let patchedArgs: Electron.BrowserWindowConstructorOptions = {
            ...options,
            webPreferences: {
                ...options.webPreferences,
                preload: `${__dirname}${s}qqntim-renderer.js`,
                devTools: true,
                webSecurity: false,
                nodeIntegration: true,
                nodeIntegrationInSubFrames: true,
                sandbox: false,
            },
        };
        interruptWindowCreation.forEach((func) => (patchedArgs = func(patchedArgs)));
        const win = new BrowserWindow(patchedArgs);
        const send = win.webContents.send;
        win.webContents.send = (channel: string, ...args: IPCArgs<any>) => {
            handleIpc(args, false);
            send.bind(win.webContents, channel, ...args)();
        };
        win.webContents.on("ipc-message", (_event, _channel, ...args: IPCArgs<any>) => {
            if (!handleIpc(args, true)) args.splice(0, args.length);
        });
        win.webContents.on(
            "ipc-message-sync",
            (event, channel, ...args: IPCArgs<any>) => {
                handleIpc(args, true);
                if (channel == "___!boot") {
                    event.returnValue = {
                        plugins: plugins,
                        resourceDir: path.dirname(options.webPreferences?.preload!),
                    };
                }
            }
        );
        return win;
    };
    Object.setPrototypeOf(func, BrowserWindow);

    return func as any as typeof Electron.BrowserWindow;
}

function patchMenu(Menu: typeof Electron.Menu) {
    const object = {
        ...Menu,
        setApplicationMenu() {
            const menu = Menu.buildFromTemplate([
                {
                    role: "toggleDevTools",
                    accelerator: "F12",
                },
                { role: "reload", accelerator: "F5" },
            ]);
            Menu.setApplicationMenu(menu);
        },
    };
    Object.setPrototypeOf(object, Menu);

    return object as any as typeof Electron.Menu;
}

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
            patchedElectron = {
                ...loadedModule,
                BrowserWindow: patchBrowserWindow(loadedModule.BrowserWindow),
                Menu: patchMenu(loadedModule.Menu),
            };
            return patchedElectron;
        }
        return loadedModule;
    };
}

export function addInterruptWindowCreation(func: InterruptWindowCreation) {
    interruptWindowCreation.push(func);
}
