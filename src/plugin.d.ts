export type Page = "login" | "main" | "chat" | "settings" | "others";
export type PageWithAbout = Page | "about";
export interface ManifestInjectionMain {
    type: "main";
    script?: string;
}
export interface ManifestInjectionRenderer {
    type: "renderer";
    page?: Page[] | undefined;
    pattern?: string;
    stylesheet?: string;
    script?: string;
}
export interface ManifestRequirementOS {
    platform: NodeJS.Platform;
    lte?: string;
    lt?: string;
    gte?: string;
    gt?: string;
    eq?: string;
}
export type ManifestInjection = ManifestInjectionMain | ManifestInjectionRenderer;
export interface Manifest {
    id: string;
    name: string;
    author: string;
    injections: ManifestInjection[];
    requirements?: {
        os: ManifestRequirementOS[];
    };
}

export interface PluginInjectionMain {
    type: "main";
    script: string | undefined;
}
export interface PluginInjectionRenderer {
    type: "renderer";
    page: Page[] | undefined;
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
    manifest: Manifest;
}
export type AllUsersPlugins = Record<string, UserPlugins>;
export type UserPlugins = Record<string, Plugin>;
export type LoadedPlugins = Record<string, Plugin>;
