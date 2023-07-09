import * as fs from "fs-extra";
import * as path from "path";

const s = path.sep;

export function getCurrentNTVersion() {
    let version: string;
    if (process.platform == "win32") {
        version = fs.readJSONSync(`${__dirname}${s}..${s}versions${s}config.json`)?.curVersion;
    } else if (process.platform == "linux") {
        version = fs.readJSONSync(`${__dirname}${s}..${s}package.json`)?.version;
    } else throw new Error(`unsupported platform: ${process.platform}`);
    if (!version) throw new Error("cannot determine QQNT version");
    return version;
}
