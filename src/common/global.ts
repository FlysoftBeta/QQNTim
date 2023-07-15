export const env = {} as QQNTim.Environment;
export const allPlugins = {} as QQNTim.Plugin.AllUsersPlugins;

export const setEnv = (value: QQNTim.Environment) => Object.assign(env, value);
export const setAllPlugins = (value: QQNTim.Plugin.AllUsersPlugins) => Object.assign(allPlugins, value);
