/**
 * @license
 * Copyright (c) Flysoft.
 */

import { patchElectron } from "./patch";
import { collectPlugins, loadConfig, plugins, prepareConfigDir } from "./plugins";
import { setPlugins } from "./loader";
import { isElectronDownloader, isPatcher } from "../env";
import { downloadElectron } from "./patcher";
import { app } from "electron";

console.log("[!Main] QQNTim 加载成功");

async function start() {
    if (isElectronDownloader) {
        await downloadElectron();
        app.exit(0);
    } else {
        if (!isPatcher) {
            try {
                prepareConfigDir();
                loadConfig();
                collectPlugins();
            } catch (reason) {
                console.error(`[!Main] 无法加载配置`);
                console.error(reason);
            }

            try {
                setPlugins(plugins);
            } catch (reason) {
                console.error(`[!Main] 无法加载插件`);
                console.error(reason);
            }
        }

        try {
            patchElectron();
        } catch (reason) {
            console.error(`[!Main] 无法修补 Electron 模块`);
            console.error(reason);
        }
    }
}

start();
