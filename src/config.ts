import { Environment } from "./main/config";

export const env: Environment = {
    plugins: {
        whitelist: undefined,
        blacklist: undefined,
    },
    verboseLogging: false,
    useNativeDevTools: false,
    disableCompatibilityProcessing: false,
};

export const setEnv = (newEnv: Environment) => {
    for (const key in newEnv) {
        env[key] = newEnv[key];
    }
};
