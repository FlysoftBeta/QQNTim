import * as semver from "semver";
import * as os from "os";
import * as fs from "fs-extra";
import * as path from "path";

export const plugins: Record<string, Plugin> = {};
const s = path.sep;

function getConfigDir() {
    return process.platform == "win32"
        ? `${process.env["UserProfile"]}${s}.qqntim`
        : `${process.env["HOME"]}${s}.local${s}share${s}QQNTim`;
}

function getPluginDir() {
    return `${getConfigDir()}${s}plugins`;
}

export function prepareConfigDir() {
    const configDir = getConfigDir(),
        pluginDir = getPluginDir();
    fs.ensureDirSync(configDir);
    fs.ensureDirSync(pluginDir);
}

interface ManifestInjectionMain {
    type: "main";
    script?: string;
}
interface ManifestInjectionRenderer {
    type: "renderer";
    page?: "login" | "main";
    pattern?: string;
    stylesheet?: string;
    script?: string;
}
interface ManifestRequirementOS {
    platform: NodeJS.Platform;
    lte?: string;
    lt?: string;
    gte?: string;
    gt?: string;
    eq?: string;
}
type ManifestInjection = ManifestInjectionMain | ManifestInjectionRenderer;
interface Manifest {
    id: number;
    name: string;
    injections: ManifestInjection[];
    requirements?: {
        os: ManifestRequirementOS[];
    };
}

interface PluginInjectionMain {
    type: "main";
    script: string | undefined;
}
interface PluginInjectionRenderer {
    type: "renderer";
    page: ("login" | "main" | "settings" | "others")[] | undefined;
    pattern: RegExp | undefined;
    stylesheet: string | undefined;
    script: string | undefined;
}
export type PluginInjection = PluginInjectionMain | PluginInjectionRenderer;
export interface Plugin {
    id: number;
    name: string;
    dir: string;
    injections: PluginInjection[];
}

export function parsePlugin(dir: string) {
    const manifestFile = `${dir}${s}qqntim.json`;
    if (!fs.existsSync(manifestFile)) return null;
    const manifest = fs.readJSONSync(manifestFile) as Manifest;

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
            console.error(
                `[!Plugins] 跳过加载插件：${manifest.id}（操作系统需求不满足）`
            );
            return null;
        }
    }

    return {
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
