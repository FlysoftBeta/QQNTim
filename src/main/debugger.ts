import { env } from "../config";
import axios from "axios";
import { start } from "chii/server";
import { BrowserWindow } from "electron";
import { getPortPromise } from "portfinder";

export let debuggerHost = "";
export let debuggerPort = -1;
export let debuggerOrigin = "";

export async function initDebugger() {
    if (!env.useNativeDevTools) {
        debuggerPort = await getPortPromise();
        debuggerHost = "127.0.0.1";
        debuggerOrigin = `http://${debuggerHost}:${debuggerPort}`;

        console.log(`[!Debugger] 正在启动 chii 调试器：${debuggerOrigin}`);
        await start({
            host: debuggerHost,
            port: debuggerPort,
            useHttps: false,
        });
    }
}

async function listChiiTargets() {
    const res = await axios.get(`${debuggerOrigin}/targets`);
    return (res.data.targets as any[]).map((target) => [target.title, target.id]);
}

export async function createDebuggerWindow(debuggerId: string, win: BrowserWindow) {
    const targets = await listChiiTargets();
    for (const [id, target] of targets) {
        if (id == debuggerId) {
            const url = `${debuggerOrigin}/front_end/chii_app.html?ws=${debuggerHost}:${debuggerPort}/client/${(Math.random() * 6).toString()}?target=${target}`;

            console.log(`[!Debugger] 正在打开 chii 调试器窗口：${url}`);

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

            debuggerWin.webContents.loadURL(url);

            win.on("closed", () => debuggerWin.destroy());

            break;
        }
    }
}
