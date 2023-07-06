import * as fs from "fs-extra";
import * as path from "path";

const s = path.sep;

export function loadLiteLoaderIfExists() {
    const liteLoaderDir = `${__dirname}${s}..${s}LiteLoader`;
    if (fs.existsSync(liteLoaderDir)) {
        console.log("[!Compatibility] 检测到 LiteLoaderQQNT，正在加载");
        require(liteLoaderDir);
    }
}
