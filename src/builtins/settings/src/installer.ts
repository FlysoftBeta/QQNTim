import { s } from "./utils/sep";
import { randomUUID } from "crypto";
import * as path from "path";
import { allPlugins, app, dialog, env, modules } from "qqntim/renderer";
import { Extract } from "unzipper";
const { fs } = modules;

export async function installZipPluginsForAccount(uin: string, requiresRestart: boolean) {
    const result = await dialog.openDialog({ title: "选择插件压缩包", properties: ["openFile"], filters: [{ name: "ZIP 压缩文件", extensions: ["zip"] }] });
    if (result.canceled) return;
    const filePath = result.filePaths[0];
    if (!(await fs.exists(filePath)) || !(await fs.stat(filePath)).isFile()) return;
    const tmpDir = `${process.platform == "win32" ? process.env["TEMP"] : "/tmp"}${s}${randomUUID()}`;

    try {
        await fs.ensureDir(tmpDir);
        await new Promise<void>((resolve, reject) =>
            fs
                .createReadStream(result.filePaths[0])
                .pipe(Extract({ path: tmpDir }))
                .on("close", () => resolve())
                .on("error", (error) => reject(error)),
        );
    } catch (reason) {
        await dialog.alert("解压插件压缩包时出现错误：\n" + reason);
        return false;
    }

    return await installPluginsForAccount(uin, requiresRestart, tmpDir);
}

export async function installFolderPluginsForAccount(uin: string, requiresRestart: boolean) {
    const result = await dialog.openDialog({ title: "选择插件文件夹", properties: ["openDirectory"] });
    if (result.canceled) return;
    const filePath = result.filePaths[0];
    if (!(await fs.exists(filePath)) || !(await fs.stat(filePath)).isDirectory()) return false;

    return await installPluginsForAccount(uin, requiresRestart, filePath);
}

async function collectManifests(dir: string) {
    const getManifestFile = async (dir: string) => {
        const manifestFile = `${dir}${s}qqntim.json`;
        if ((await fs.exists(manifestFile)) && (await fs.stat(manifestFile)).isFile()) return manifestFile;
    };

    let manifestFiles: string[] = [];
    const manifestFile = await getManifestFile(dir);
    if (!manifestFile) {
        const folders = await fs.readdir(dir);
        manifestFiles = (
            await Promise.all(
                folders.map(async (folder) => {
                    const folderPath = `${dir}${s}${folder}`;
                    if ((await fs.exists(folderPath)) && (await fs.stat(folderPath)).isDirectory()) {
                        return await getManifestFile(folderPath);
                    }
                }),
            )
        ).filter(Boolean) as string[];
    } else manifestFiles = [manifestFile];

    return manifestFiles;
}

async function installPluginsForAccount(uin: string, requiresRestart: boolean, dir: string) {
    const manifestFiles = await collectManifests(dir);
    if (manifestFiles.length == 0) {
        await dialog.alert("未在目标文件夹或文件夹搜索到任何插件。\n请联系插件作者以获得更多信息。");
        return false;
    }

    let count = 0;
    for (const manifestFile of manifestFiles) {
        const manifest = fs.readJSONSync(manifestFile) as QQNTim.Manifest;
        const pluginDir = `${uin == "" ? env.path.pluginDir : `${env.path.pluginPerUserDir}${s}${uin}`}${s}${manifest.id}`;
        if (!(await dialog.confirm(`扫描到一个插件：\n\nID：${manifest.id}\n名称：${manifest.name}\n作者：${manifest.author || "未知"}\n说明：${manifest.description || "该插件没有提供说明。"}\n\n是否希望安装此插件？`))) continue;
        try {
            if (allPlugins[uin]?.[manifest.id]) await fs.rm(allPlugins[uin][manifest.id].dir);
            await fs.ensureDir(pluginDir);
            await fs.copy(path.dirname(manifestFile), pluginDir);
            count++;
        } catch (reason) {
            await dialog.alert("复制插件时出现错误：\n" + reason);
        }
    }

    await dialog.alert(`成功安装了 ${count} 个插件。${requiresRestart ? `\n\n点击 "确定" 将重启你的 QQ。` : ""}`);
    if (requiresRestart) app.relaunch();
    return true;
}

export async function uninstallPlugin(requiresRestart: boolean, pluginDir: string) {
    if (!(await dialog.confirm("是否要卸载此插件？"))) return false;
    try {
        await fs.remove(pluginDir);
        await dialog.alert(`成功卸载此插件。${requiresRestart ? `\n\n点击 "确定" 将重启你的 QQ。` : ""}`);
        if (requiresRestart) app.relaunch();
        return true;
    } catch (reason) {
        await dialog.alert(`卸载插件时出现错误：\n${reason}`);
        return false;
    }
}
