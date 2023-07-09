import { QQNTim } from "@flysoftbeta/qqntim-typings";

export interface PluginInjectionMain {
    type: "main";
    script: string | undefined;
}
export interface PluginInjectionRenderer {
    type: "renderer";
    page: QQNTim.Manifest.Page[] | undefined;
    pattern: RegExp | undefined;
    stylesheet: string | undefined;
    script: string | undefined;
}
export type PluginInjection = PluginInjectionMain | PluginInjectionRenderer;
export interface Plugin {
    loaded: boolean;
    meetRequirements: boolean;
    enabled: boolean;
    id: string;
    name: string;
    dir: string;
    injections: PluginInjection[];
    manifest: QQNTim.Manifest.Manifest;
}
export type AllUsersPlugins = Record<string, UserPlugins>;
export type UserPlugins = Record<string, Plugin>;
export type LoadedPlugins = Record<string, Plugin>;
