import * as fs from "fs-extra";
import * as path from "path";

const s = path.sep;

export function getCurrentNTResourceDir() {
    let resourceDir: string;

    if (process.platform == "win32") {
        const version = fs.readJSONSync(
            `${__dirname}${s}..${s}versions${s}config.json`
        )?.curVersion;
        if (!version) throw new Error("cannot determine QQNT version");

        resourceDir = `${__dirname}${s}..${s}versions${s}${version}`;
    } else if (process.platform == "linux") resourceDir = `${__dirname}${s}..`;
    else throw new Error("unsupported platform: " + process.platform);

    if (!fs.existsSync(resourceDir)) throw new Error("cannot find QQNT package");

    return resourceDir;
}
