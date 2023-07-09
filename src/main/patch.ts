import { env } from "../globalVar";
import { handleIpc } from "../ipc";
import { apply, construct, getter, setter } from "../watch";
import { createDebuggerWindow, debuggerOrigin } from "./debugger";
import { applyPlugins } from "./loader";
import { plugins } from "./plugins";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import { BrowserWindow, Menu, MenuItem, ipcMain, app } from "electron";
import { Module } from "module";
import * as path from "path";

const s = path.sep;
const interruptWindowArgs: QQNTim.WindowCreation.InterruptArgsFunction[] = [];
const interruptWindowCreation: QQNTim.WindowCreation.InterruptFunction[] = [];

ipcMain.on("___!boot", (event) => {
    if (!event.returnValue) event.returnValue = { enabled: false };
});

function patchBrowserWindow(BrowserWindow: typeof Electron.BrowserWindow) {
    const windowMenu: Electron.MenuItem[] = [
        new MenuItem({
            label: "刷新",
            role: "reload",
            accelerator: "F5",
        }),
        new MenuItem({
            label: "开发者工具",
            accelerator: "F12",
            ...(env.config.useNativeDevTools
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
    return new Proxy(BrowserWindow, {
        apply(target, thisArg, argArray) {
            return apply(target, thisArg, argArray);
        },
        get(target, p) {
            return getter("BrowserWindow(static)", target, p as any);
        },
        set(target, p, newValue) {
            return setter("BrowserWindow(static)", target, p as any, newValue);
        },
        construct(target, [options]: [Electron.BrowserWindowConstructorOptions]) {
            let patchedArgs: Electron.BrowserWindowConstructorOptions = {
                ...options,
                webPreferences: {
                    ...options.webPreferences,
                    preload: undefined,
                    webSecurity: false,
                    allowRunningInsecureContent: true,
                    nodeIntegration: true,
                    nodeIntegrationInSubFrames: true,
                    contextIsolation: false,
                    devTools: env.config.useNativeDevTools,
                    sandbox: false,
                },
            };
            interruptWindowArgs.forEach((func) => {
                patchedArgs = func(patchedArgs);
            });
            const win = construct("BrowserWindow", target, [patchedArgs]) as BrowserWindow;

            const id = win.webContents.id.toString();

            const sess = win.webContents.session;

            const preloads = [options.webPreferences?.preload, ...sess.getPreloads()];
            let thirdpartyPreloads: string[] = [];
            sess.setPreloads([`${__dirname}${s}qqntim-renderer.js`]);

            // Temporary solution to readonly `setPreloads` :(
            // TODO: Remove this try {} catch {}
            try {
                Object.defineProperty(sess, "setPreloads", {
                    get() {
                        return (newPreloads) => {
                            thirdpartyPreloads = newPreloads;
                        };
                    },
                });
            } catch {}

            const send = win.webContents.send;
            win.webContents.send = (channel: string, ...args: QQNTim.IPC.Args<any>) => {
                handleIpc(args, "out", channel);
                return send.call(win.webContents, channel, ...args);
            };
            win.webContents.on("ipc-message", (_, channel, ...args: QQNTim.IPC.Args<any>) => {
                if (!handleIpc(args, "in", channel, win.webContents)) {
                    throw new Error("forcibly stopped IPC propagation (Note that this is not a bug)");
                }
                if (channel == "___!apply_plugins") applyPlugins(plugins, args[1] as string);
            });
            win.webContents.on("ipc-message-sync", (event, channel, ...args: QQNTim.IPC.Args<any>) => {
                handleIpc(args, "in", channel, win.webContents);
                if (channel == "___!boot") {
                    event.returnValue = {
                        enabled: true,
                        preload: [...preloads, ...thirdpartyPreloads],
                        debuggerOrigin: !env.config.useNativeDevTools && debuggerOrigin,
                        debuggerId: id,
                        plugins: plugins,
                        env: env,
                    };
                } else if (channel == "___!browserwindow_api") {
                    event.returnValue = win[args[1][0]](...args[1][1]);
                } else if (channel == "___!app_api") {
                    event.returnValue = app[args[1][0]](...args[1][1]);
                }
            });
            if (!env.config.useNativeDevTools)
                win.webContents.on("console-message", (_, level, message) => {
                    message = `[!Renderer:${id}] ${message}`;
                    if (level == 0) console.debug(message);
                    else if (level == 1) console.log(message);
                    else if (level == 2) console.warn(message);
                    else if (level == 3) console.error(message);
                });

            const setMenu = win.setMenu;
            win.setMenu = (menu) => {
                const patchedMenu = Menu.buildFromTemplate([...(menu?.items || []), ...windowMenu]);
                return setMenu.call(win, patchedMenu);
            };
            win.setMenu(null);

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

export function addInterruptWindowCreation(func: QQNTim.WindowCreation.InterruptFunction) {
    interruptWindowCreation.push(func);
}

export function addInterruptWindowArgs(func: QQNTim.WindowCreation.InterruptArgsFunction) {
    interruptWindowArgs.push(func);
}

export function patchElectron() {
    // Prevent Electron from generating default menu (which will take a lot system resources).
    Menu.setApplicationMenu(null);

    let patchedElectron: typeof Electron.CrossProcessExports;
    const loadBackend = (Module as any)._load;
    (Module as any)._load = (request: string, parent: NodeModule, isMain: boolean) => {
        const loadedModule = loadBackend(request, parent, isMain) as typeof Electron.CrossProcessExports;
        if (request == "electron") {
            if (!patchedElectron)
                patchedElectron = {
                    ...loadedModule,
                    BrowserWindow: patchBrowserWindow(loadedModule.BrowserWindow),
                };
            return patchedElectron;
        }
        return loadedModule;
    };
}
