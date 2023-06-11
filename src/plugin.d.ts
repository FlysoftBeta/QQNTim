export interface ManifestInjectionMain {
    type: "main";
    script?: string;
}
export interface ManifestInjectionRenderer {
    type: "renderer";
    page?: ("login" | "main" | "chat" | "settings" | "others")[] | undefined;
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
    page: ("login" | "main" | "chat" | "settings" | "others")[] | undefined;
    pattern: RegExp | undefined;
    stylesheet: string | undefined;
    script: string | undefined;
}
export type PluginInjection = PluginInjectionMain | PluginInjectionRenderer;
export interface Plugin {
    id: string;
    name: string;
    dir: string;
    injections: PluginInjection[];
}
