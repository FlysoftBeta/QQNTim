import * as fs from "fs-extra";
import * as path from "path";

const s = path.sep;

export function getCurrentNTVersion() {
    if (process.platform == "win32") {
        const version = fs.readJSONSync(`${__dirname}${s}..${s}versions${s}config.json`)?.curVersion;
        if (!version) throw new Error("cannot determine QQNT version");

        return version;
    } else if (process.platform == "linux") {
        const version = fs.readJSONSync(`${__dirname}${s}..${s}package.json`)?.version;
        if (!version) throw new Error("cannot determine QQNT version");

        return version;
    } else throw new Error(`unsupported platform: ${process.platform}`);
}
