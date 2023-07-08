import { configFile, dataDir, pluginDir, pluginPerUserDir } from "../files";
import * as fs from "fs-extra";

export type Configuration = Partial<Environment>;

export interface Environment {
    plugins: {
        whitelist?: string[];
        blacklist?: string[];
    };
    verboseLogging: boolean;
    useNativeDevTools: boolean;
    disableCompatibilityProcessing: boolean;
}

function toBoolean(item: boolean | undefined, env: string, defaultValue: boolean) {
    const envValue = process.env[env];
    return envValue ? !!parseInt(envValue) : typeof item == "boolean" ? item : defaultValue;
}

function toStringArray(item: string[] | undefined, env: string, defaultValue: string[] | undefined) {
    const envValue = process.env[env];
    return envValue ? envValue.split(";") : item instanceof Array ? item : defaultValue;
}

// function toNumberArray(
//     item: number[] | undefined,
//     env: string,
//     defaultValue: number[] | undefined,
//     isFloat = false
// ) {
//     const envValue = process.env[env];
//     return envValue
//         ? envValue
//               .split(";")
//               .map((value) => (isFloat ? parseFloat(value) : parseInt(value)))
//         : item instanceof Array
//         ? item
//         : defaultValue;
// }

export function getEnvironment(config: Configuration): Environment {
    return {
        plugins: {
            whitelist: toStringArray(config.plugins?.whitelist, "QQNTIM_PLUGINS_WHITELIST", undefined),
            blacklist: toStringArray(config.plugins?.blacklist, "QQNTIM_PLUGINS_BLACKLIST", undefined),
        },
        verboseLogging: toBoolean(config.verboseLogging, "QQNTIM_VERBOSE_LOGGING", false),
        useNativeDevTools: toBoolean(config.useNativeDevTools, "QQNTIM_USE_NATIVE_DEVTOOLS", false),
        disableCompatibilityProcessing: toBoolean(config.disableCompatibilityProcessing, "QQNTIM_NO_COMPATIBILITY_PROCESSING", false),
    };
}

function prepareDataDir() {
    fs.ensureDirSync(dataDir);
    fs.ensureDirSync(pluginDir);
    fs.ensureDirSync(pluginPerUserDir);
    if (!fs.existsSync(configFile)) fs.writeJSONSync(configFile, {});
}

export function loadConfig() {
    prepareDataDir();
    const config = fs.readJSONSync(configFile) || {};
    return getEnvironment(config);
}
