import { env } from "../globalVar";
import { pluginDir, pluginPerUserDir } from "../files";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as semver from "semver";

const supportedManifestVersions: QQNTim.Manifest.ManifestVersion[] = ["1.0", "2.0"];
export const plugins: QQNTim.Plugin.AllUsersPlugins = {};
const s = path.sep;

function isPluginEnabled(manifest: QQNTim.Manifest.Manifest) {
    if (env.config.plugins.whitelist) return env.config.plugins.whitelist.includes(manifest.id);
    else if (env.config.plugins.blacklist) return !env.config.plugins.blacklist.includes(manifest.id);
    else return true;
}

function isPluginRequirementsMet(manifest: QQNTim.Manifest.Manifest) {
    if (manifest.requirements?.os) {
        let meetRequirements = false;
        const osRelease = os.release();
        for (const item of manifest.requirements.os) {
            if (item.platform != process.platform) continue;
            if (item.lte && !semver.lte(item.lte, osRelease)) continue;
            if (item.lt && !semver.lt(item.lt, osRelease)) continue;
            if (item.gte && !semver.gte(item.gte, osRelease)) continue;
            if (item.gt && !semver.gt(item.gt, osRelease)) continue;
            if (item.eq && !semver.eq(item.eq, osRelease)) continue;
            meetRequirements = true;
            break;
        }
        if (!meetRequirements) {
            return false;
        }
    }

    return true;
}

export function parsePlugin(dir: string) {
    try {
        const manifestFile = `${dir}${s}qqntim.json`;
        if (!fs.existsSync(manifestFile)) return null;
        const manifest = fs.readJSONSync(manifestFile) as QQNTim.Manifest.Manifest;
        if (!manifest.manifestVersion) manifest.manifestVersion = supportedManifestVersions[0];
        else if (!supportedManifestVersions.includes(manifest.manifestVersion)) throw new TypeError(`此插件包含一个无效的清单版本：${manifest.manifestVersion}，支持的版本有：${supportedManifestVersions.join(", ")}`);

        const meetRequirements = isPluginRequirementsMet(manifest);
        const enabled = isPluginEnabled(manifest);
        const loaded = meetRequirements && enabled;
        if (!meetRequirements) console.error(`[!Plugins] 跳过加载插件：${manifest.id}（当前环境不满足要求）`);
        else if (!enabled) console.error(`[!Plugins] 跳过加载插件：${manifest.id}（插件已被禁用）`);

        return {
            enabled: enabled,
            meetRequirements: meetRequirements,
            loaded: loaded,
            id: manifest.id,
            dir: dir,
            injections: manifest.injections.map((injection) => {
                return injection.type == "main"
                    ? { ...injection }
                    : {
                          ...injection,
                          pattern: injection.pattern && new RegExp(injection.pattern),
                      };
            }),
            manifest: manifest,
        } as QQNTim.Plugin.Plugin;
    } catch (reason) {
        console.error("[!Plugins] 解析插件时出现意外错误：", dir);
        console.error(reason);
        return null;
    }
}

function collectPluginsFromDir(baseDir: string, uin = "") {
    const folders = fs.readdirSync(baseDir);
    if (!plugins[uin]) plugins[uin] = {};
    folders.forEach((folder) => {
        const folderPath = `${baseDir}${s}${folder}`;
        if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
            const plugin = parsePlugin(folderPath);
            if (!plugin) return;
            if (plugins[uin][plugin.id]) return;
            plugins[uin][plugin.id] = plugin;
        }
    });
}

export function collectPlugins() {
    collectPluginsFromDir(`${__dirname}${s}builtins`);
    collectPluginsFromDir(pluginDir);
    const folders = fs.readdirSync(pluginPerUserDir);
    folders.forEach((folder) => {
        const folderPath = `${pluginPerUserDir}${s}${folder}`;
        if (fs.statSync(folderPath).isDirectory()) {
            collectPluginsFromDir(folderPath, folder);
        }
    });
}
