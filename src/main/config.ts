import { configFile, dataDir, pluginDir, pluginPerUserDir } from "../common/paths";
import * as fs from "fs-extra";

function toBoolean(item: boolean | undefined, env: string, defaultValue: boolean) {
    const envValue = process.env[env];
    return envValue ? !!parseInt(envValue) : typeof item == "boolean" ? item : defaultValue;
}

function toStringArray<T extends string[], R extends T | undefined>(item: R, env: string, defaultValue: R) {
    const envValue = process.env[env];
    return envValue ? envValue.split(";") : item && item instanceof Array ? item : defaultValue;
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

export function getEnvironment(config: QQNTim.Configuration): QQNTim.Environment {
    return {
        config: {
            plugins: {
                whitelist: toStringArray(config.plugins?.whitelist, "QQNTIM_PLUGINS_WHITELIST", undefined),
                blacklist: toStringArray(config.plugins?.blacklist, "QQNTIM_PLUGINS_BLACKLIST", undefined),
            },
            pluginLoaders: toStringArray(config.pluginLoaders, "QQNTIM_PLUGIN_LOADER", ["LiteLoader", "LiteLoaderQQNT"]),
            verboseLogging: toBoolean(config.verboseLogging, "QQNTIM_VERBOSE_LOGGING", false),
            useNativeDevTools: toBoolean(config.useNativeDevTools, "QQNTIM_USE_NATIVE_DEVTOOLS", false),
            disableCompatibilityProcessing: toBoolean(config.disableCompatibilityProcessing, "QQNTIM_NO_COMPATIBILITY_PROCESSING", false),
        },
        path: {
            dataDir,
            configFile,
            pluginDir,
            pluginPerUserDir,
        },
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
