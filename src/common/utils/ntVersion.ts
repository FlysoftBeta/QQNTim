import { s } from "../sep";
import { readJSONSync } from "fs-extra";

export function getCurrentNTVersion() {
    let version: string;
    if (process.platform == "win32") {
        version = readJSONSync(`${__dirname}${s}..${s}versions${s}config.json`)?.curVersion;
    } else if (process.platform == "linux" || process.platform == "darwin") {
        version = readJSONSync(`${__dirname}${s}..${s}package.json`)?.version;
    } else throw new Error(`unsupported platform: ${process.platform}`);
    if (!version) throw new Error("cannot determine QQNT version");
    return version;
}
