import * as path from "path";
import { Module } from "module";
import { BrowserWindow, Menu, MenuItem } from "electron";
import { applyPlugins } from "./loader";
import { InterruptWindowCreation, IPCArgs, handleIpc } from "../ipc";
import { createDebuggerWindow, debuggerOrigin } from "./debugger";
import { useNativeDevTools } from "../env";
import { plugins } from "./plugins";
import { apply, construct, getter, setter } from "../watch";

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
    return new Proxy(BrowserWindow, {
        apply(target, thisArg, argArray) {
            return apply(target, thisArg, argArray);
        },
        get(target, p) {
            return getter(`BrowserWindow(static)`, target, p as any);
        },
        set(target, p, newValue) {
            return setter(`BrowserWindow(static)`, target, p as any, newValue);
        },
        construct(target, [options]: [Electron.BrowserWindowConstructorOptions]) {
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
            const win = construct(`BrowserWindow`, target, [
                patchedArgs,
            ]) as BrowserWindow;

            const id = win.webContents.id.toString();

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
                if (channel == "___!apply_plugins")
                    applyPlugins(plugins, args[1] as string);
            });
            win.webContents.on(
                "ipc-message-sync",
                (_, channel, ...args: IPCArgs<any>) => {
                    if (!handleIpc(args, "in", channel, win.webContents)) {
                        throw new Error(
                            "forcibly stopped IPC propagation (Note that this is not a bug)"
                        );
                    }
                }
            );
            win.webContents.on(
                "ipc-message-sync",
                (event, channel, ...args: IPCArgs<any>) => {
                    handleIpc(args, "in", channel);
                    if (channel == "___!boot") {
                        event.returnValue = {
                            preload: options.webPreferences?.preload,
                            debuggerOrigin: !useNativeDevTools && debuggerOrigin,
                            debuggerId: id,
                            plugins: plugins,
                        };
                    } else if (channel == "___!browserwindow_api") {
                        event.returnValue = win[args[1][0]](...args[1][1]);
                    }
                }
            );

            win.setMenu(Menu.buildFromTemplate(windowMenu));
            win.setMenu = (menu) => {
                if (!menu) return;
                win.setMenu = () => {};
                windowMenu.forEach((item) => menu.append(item));
            };

            return new Proxy(win, {
                get(target, p) {
                    return getter(`BrowserWindow?${id}`, target, p as any);
                },
                set(target, p, newValue) {
                    return setter(`BrowserWindow?${id}`, target, p as any, newValue);
                },
            });
        },
    });
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
