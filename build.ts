import { build } from "esbuild";
import { copySync, emptyDirSync } from "fs-extra";

const isDebug = process.env["NODE_ENV"] == "development";

emptyDirSync("dist");

build({
    bundle: true,
    target: "node18",
    platform: "node",
    entryPoints: ["src/main.ts"],
    outfile: "dist/qqntim.js",
    write: true,
    allowOverwrite: true,
    external: ["electron"],
    sourcemap: isDebug ? "inline" : false,
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
    external: ["electron", "./major.node", "../major.node"],
    sourcemap: isDebug ? "inline" : false,
    minify: true,
    treeShaking: true,
});

copySync("publish", "dist");
