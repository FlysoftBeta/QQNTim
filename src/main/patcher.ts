import * as path from "path";
import { download } from "@electron/get";
import extract = require("extract-zip");

export async function downloadElectron() {
    const zipFilePath = await download(process.versions.electron, {
        mirrorOptions: {
            mirror: "https://npmmirror.com/mirrors/electron/",
        },
    });
    await extract(zipFilePath, { dir: path.dirname(process.argv0) });
}
