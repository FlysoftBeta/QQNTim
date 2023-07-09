import { QQNTim } from "@flysoftbeta/qqntim-typings";

export const env = {} as QQNTim.Configuration.Environment;
export const allPlugins = {} as QQNTim.Plugin.AllUsersPlugins;

export const setEnv = (value: QQNTim.Configuration.Environment) => Object.assign(env, value);
export const setAllPlugins = (value: QQNTim.Plugin.AllUsersPlugins) => Object.assign(allPlugins, value);
