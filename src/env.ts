import * as path from "path";

const s = path.sep;

export const verboseLogging = !!process.env["QQNTIM_VERBOSE_LOGGING"];
export const useNativeDevTools = !!process.env["QQNTIM_USE_NATIVE_DEVTOOLS"];
export const dataDir = path.resolve(
    process.env["QQNTIM_HOME"] ||
        (process.platform == "win32"
            ? `${process.env["UserProfile"]}${s}.qqntim`
            : `${process.env["HOME"]}${s}.local${s}share${s}QQNTim`)
);
export const configFile = `${dataDir}${s}config.json`;
export const pluginDir = `${dataDir}${s}plugins`;
export const pluginPerUserDir = `${dataDir}${s}plugins-user`;
export const disableCompatibilityProcessing =
    !!process.env["QQNTIM_NO_COMPATIBILITY_PROCESSING"];
