import * as path from "path";
import { Module } from "module";
import { plugins } from "./loader";
import { InterruptWindowCreation, IPCArgs, handleIpc } from "../ipc";
import { createDebuggerWindow, debuggerOrigin } from "./debugger";
import { BrowserWindow, Menu } from "electron";
import { useNativeDevTools } from "../env";

const s = path.sep;

const interruptWindowCreation: InterruptWindowCreation[] = [];

function patchBrowserWindow(windowMenu: Menu) {
    const func = function (options: Electron.BrowserWindowConstructorOptions) {
        let patchedArgs: Electron.BrowserWindowConstructorOptions = {
            ...options,
            webPreferences: {
                ...options.webPreferences,
                preload: `${__dirname}${s}qqntim-renderer.js`,
                webSecurity: false,
                allowRunningInsecureContent: true,
                nodeIntegration: true,
                nodeIntegrationInSubFrames: true,
                contextIsolation: true,
                devTools: useNativeDevTools,
                sandbox: false,
            },
        };
        interruptWindowCreation.forEach((func) => (patchedArgs = func(patchedArgs)));
        const win = new BrowserWindow(patchedArgs);

        const debuggerId = win.webContents.id.toString();

        const send = win.webContents.send;
        win.webContents.send = (channel: string, ...args: IPCArgs<any>) => {
            handleIpc(args, "out", channel);
            send.bind(win.webContents, channel, ...args)();
        };
        win.webContents.on("ipc-message", (_, channel, ...args: IPCArgs<any>) => {
            if (!handleIpc(args, "in", channel, win.webContents)) {
                throw new Error(
                    "forcibly stopped IPC propagation (Note that this is not a bug)"
                );
            }
        });
        win.webContents.on(
            "ipc-message-sync",
            (event, channel, ...args: IPCArgs<any>) => {
                handleIpc(args, "in", channel);
                if (channel == "___!boot") {
                    event.returnValue = {
                        debuggerOrigin: !useNativeDevTools && debuggerOrigin,
                        debuggerId: debuggerId,
                        plugins: plugins,
                        resourceDir: path.dirname(options.webPreferences?.preload!),
                    };
                }
            }
        );

        win.setMenu(windowMenu);
        win.setMenu = () => undefined;

        return win;
    };
    Object.setPrototypeOf(func, BrowserWindow);

    return func as any as typeof Electron.BrowserWindow;
}

function constructMenu() {
    return Menu.buildFromTemplate([
        {
            label: "刷新",
            role: "reload",
            accelerator: "F5",
        },
        {
            label: "强制刷新",
            role: "forceReload",
            accelerator: "Ctrl+F5",
        },
        useNativeDevTools
            ? {
                  label: "开发者工具",
                  role: "toggleDevTools",
                  accelerator: "F12",
              }
            : {
                  label: "开发者工具",
                  accelerator: "F12",
                  click: (_, win) => {
                      if (!win) return;
                      const debuggerId = win.webContents.id.toString();
                      createDebuggerWindow(debuggerId, win);
                  },
              },
    ]);
}

export function addInterruptWindowCreation(func: InterruptWindowCreation) {
    interruptWindowCreation.push(func);
}

export function patchElectron() {
    // Prevent Electron from generating default menu (which will take a lot system resources).
    Menu.setApplicationMenu(null);
    const windowMenu = constructMenu();

    let patchedElectron: typeof Electron.CrossProcessExports;
    const loadBackend = (Module as any)._load;
    (Module as any)._load = (request: string, parent: NodeModule, isMain: boolean) => {
        const loadedModule = loadBackend(
            request,
            parent,
            isMain
        ) as typeof Electron.CrossProcessExports;
        if (request == "electron") {
            if (!patchedElectron)
                patchedElectron = {
                    ...loadedModule,
                    BrowserWindow: patchBrowserWindow(windowMenu),
                };
            return patchedElectron;
        }
        return loadedModule;
    };
}
