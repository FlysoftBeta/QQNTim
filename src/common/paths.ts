import { s } from "./sep";

export const dataDir = process.env["QQNTIM_HOME"] || (process.platform == "win32" ? `${process.env["UserProfile"]}${s}.qqntim` : `${process.env["HOME"]}${s}.local${s}share${s}QQNTim`);
export const configFile = `${dataDir}${s}config.json`;
export const pluginDir = `${dataDir}${s}plugins`;
export const pluginPerUserDir = `${dataDir}${s}plugins-user`;
