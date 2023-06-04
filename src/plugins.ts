import { ensureDirSync, readJSONSync, readdirSync, statSync } from "fs-extra";
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
    ensureDirSync(configDir);
    ensureDirSync(pluginDir);
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
type ManifestInjection = ManifestInjectionMain | ManifestInjectionRenderer;
interface Manifest {
    id: number;
    name: string;
    injections: ManifestInjection[];
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
    const manifest = readJSONSync(manifestFile) as Manifest;

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
    const folders = readdirSync(pluginDir);

    folders.forEach((folder) => {
        const folderPath = `${pluginDir}${s}${folder}`;
        if (statSync(folderPath).isDirectory()) {
            const plugin = parsePlugin(folderPath);
            if (plugins[plugin.id]) return;
            plugins[plugin.id] = plugin;
        }
    });
    return plugins;
}
