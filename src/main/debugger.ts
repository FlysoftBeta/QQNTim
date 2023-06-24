import axios from "axios";
import { start } from "chii/server";
import { BrowserWindow } from "electron";
import { getPortPromise } from "portfinder";

export let debuggerHost = "";
export let debuggerPort = Infinity;
export let debuggerOrigin = "";

export async function initDebugger() {
    debuggerPort = await getPortPromise();
    debuggerHost = "127.0.0.1";
    debuggerOrigin = `http://${debuggerHost}:${debuggerPort}`;

    await start({ host: debuggerHost, port: debuggerPort, useHttps: false });
}

export function createDebuggerWindow(debuggerId: string, win: BrowserWindow) {
    axios.get(`${debuggerOrigin}/targets`).then((ret) => {
        const targets = ret.data.targets as any[];
        for (const target of targets) {
            if (target.title == debuggerId) {
                const debuggerWin = new BrowserWindow({
                    width: 800,
                    height: 600,
                    show: true,
                    webPreferences: {
                        webSecurity: false,
                        allowRunningInsecureContent: true,
                        devTools: false,
                        nodeIntegration: false,
                        nodeIntegrationInSubFrames: false,
                        contextIsolation: true,
                    },
                });

                debuggerWin.webContents.loadURL(
                    `${debuggerOrigin}/front_end/chii_app.html?ws=${debuggerHost}:${debuggerPort}/client/${(
                        Math.random() * 6
                    ).toString()}?target=${target.id}`
                );

                win.on("closed", () => debuggerWin.destroy());

                break;
            }
        }
    });
}
