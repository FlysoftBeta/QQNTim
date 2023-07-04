import * as path from "path";
import { Module } from "module";
import { applyPlugins } from "./loader";
import { InterruptWindowCreation, IPCArgs, handleIpc } from "../ipc";
import { createDebuggerWindow, debuggerOrigin } from "./debugger";
import { BrowserWindow, Menu, MenuItem } from "electron";
import { useNativeDevTools } from "../env";
import { plugins } from "./plugins";

const s = path.sep;

const interruptWindowCreation: InterruptWindowCreation[] = [];

const windowMenu: Electron.MenuItem[] = [
    new MenuItem({
        label: "刷新",
        role: "reload",
        accelerator: "F5",
    }),
    new MenuItem({
        label: "开发者工具",
        accelerator: "F12",
        ...(useNativeDevTools
            ? { role: "toggleDevTools" }
            : {
                  click: (_, win) => {
                      if (!win) return;
                      const debuggerId = win.webContents.id.toString();
                      createDebuggerWindow(debuggerId, win);
                  },
              }),
    }),
];

function patchBrowserWindow() {
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
            if (channel == "___!apply_plugins") {
                applyPlugins(plugins, args[0] as any as string);
            }
        });
        win.webContents.on(
            "ipc-message-sync",
            (event, channel, ...args: IPCArgs<any>) => {
                if (!handleIpc(args, "in", channel, win.webContents)) {
                    throw new Error(
                        "forcibly stopped IPC propagation (Note that this is not a bug)"
                    );
                }
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

        win.setMenu(Menu.buildFromTemplate(windowMenu));
        win.setMenu = (menu) => {
            if (!menu) return;
            win.setMenu = () => {};
            windowMenu.forEach((item) => menu.append(item));
        };

        return win;
    };
    Object.setPrototypeOf(func, BrowserWindow);

    return func as any as typeof Electron.BrowserWindow;
}

export function addInterruptWindowCreation(func: InterruptWindowCreation) {
    interruptWindowCreation.push(func);
}

export function patchElectron() {
    // Prevent Electron from generating default menu (which will take a lot system resources).
    Menu.setApplicationMenu(null);

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
                    BrowserWindow: patchBrowserWindow(),
                };
            return patchedElectron;
        }
        return loadedModule;
    };
}
