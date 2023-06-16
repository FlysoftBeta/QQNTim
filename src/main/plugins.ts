import * as semver from "semver";
import * as os from "os";
import * as fs from "fs-extra";
import * as path from "path";
import { Plugin, Manifest } from "../plugin";
import { Configuration } from "../config";

let config: Configuration = {};
export const plugins: Record<string, Plugin> = {};
const s = path.sep;

function getConfigDir() {
    return process.platform == "win32"
        ? `${process.env["UserProfile"]}${s}.qqntim`
        : `${process.env["HOME"]}${s}.local${s}share${s}QQNTim`;
}

function getConfigFile() {
    return `${getConfigDir()}${s}config.json`;
}

function getPluginDir() {
    return `${getConfigDir()}${s}plugins`;
}

export function prepareConfigDir() {
    const configDir = getConfigDir(),
        configFile = getConfigFile(),
        pluginDir = getPluginDir();
    fs.ensureDirSync(configDir);
    fs.ensureDirSync(pluginDir);
    if (!fs.existsSync(configFile)) fs.writeJSONSync(configFile, {});
}

export function loadConfig() {
    const configFile = getConfigFile();
    config = fs.readJSONSync(configFile) || {};
}

function isPluginEnabled(manifest: Manifest) {
    if (config.plugins?.whitelist && !config.plugins.whitelist.includes(manifest.id)) {
        return false;
    }
    if (config.plugins?.blacklist && config.plugins.blacklist.includes(manifest.id)) {
        return false;
    }

    return true;
}

function isPluginRequirementsMet(manifest: Manifest) {
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
    const manifestFile = `${dir}${s}qqntim.json`;
    if (!fs.existsSync(manifestFile)) return null;
    const manifest = fs.readJSONSync(manifestFile) as Manifest;

    const meetRequirements = isPluginRequirementsMet(manifest),
        enabled = isPluginEnabled(manifest),
        loaded = meetRequirements && enabled;
    if (!meetRequirements)
        console.error(`[!Plugins] 跳过加载插件：${manifest.id}（当前环境不满足要求）`);
    else if (!enabled)
        console.error(`[!Plugins] 跳过加载插件：${manifest.id}（插件已被禁用）`);

    return {
        enabled: enabled,
        meetRequirements: meetRequirements,
        loaded: loaded,
        id: manifest.id,
        name: manifest.name,
        dir: dir,
        injections: manifest.injections.map((injection) => {
            return injection.type == "main"
                ? { ...injection }
                : {
                      ...injection,
                      pattern: injection.pattern && new RegExp(injection.pattern),
                  };
        }),
    } as Plugin;
}

export function collectPlugins() {
    const pluginDir = getPluginDir();
    const folders = fs.readdirSync(pluginDir);

    folders.forEach((folder) => {
        const folderPath = `${pluginDir}${s}${folder}`;
        if (fs.statSync(folderPath).isDirectory()) {
            const plugin = parsePlugin(folderPath);
            if (!plugin) return;
            if (plugins[plugin.id]) return;
            plugins[plugin.id] = plugin;
        }
    });
    return plugins;
}
