import { build } from "esbuild";
import { copySync, emptyDirSync } from "fs-extra";

emptyDirSync("dist");

build({
    bundle: true,
    target: "node18",
    entryPoints: ["src/main.ts"],
    outfile: "dist/qqntim.js",
    write: true,
    allowOverwrite: true,
    external: [
        "fs",
        "path",
        "util",
        "assert",
        "stream",
        "constants",
        "vm",
        "module",
        "crypto",
        "electron",
    ],
    sourcemap: "inline",
    minify: true,
    treeShaking: true,
});

build({
    bundle: true,
    target: "node18",
    platform: "node",
    entryPoints: ["src/renderer/main.ts"],
    outfile: "dist/qqntim-renderer.js",
    write: true,
    allowOverwrite: true,
    external: [
        "fs",
        "path",
        "util",
        "assert",
        "stream",
        "constants",
        "vm",
        "module",
        "crypto",
        "electron",
        "./major.node",
        "../major.node",
    ],
    sourcemap: "inline",
    minify: true,
    treeShaking: true,
});

copySync("publish", "dist");
