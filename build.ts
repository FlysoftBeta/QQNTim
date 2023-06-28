import { BuildOptions, build } from "esbuild";
import { copySync, emptyDirSync } from "fs-extra";

const isProduction = process.env["NODE_ENV"] == "production";

emptyDirSync("dist");

const commonOptions: Partial<BuildOptions> = {
    target: "node18",
    bundle: true,
    platform: "node",
    write: true,
    allowOverwrite: true,
    sourcemap: isProduction ? false : "inline",
    minify: isProduction,
    treeShaking: isProduction,
};

build({
    ...commonOptions,
    entryPoints: ["src/main/main.ts"],
    outfile: "dist/qqntim.js",
    external: ["electron"],
});
build({
    ...commonOptions,
    entryPoints: ["src/renderer/main.ts"],
    outfile: "dist/qqntim-renderer.js",
    external: ["electron", "./major.node", "../major.node"],
});
build({
    ...commonOptions,
    target: "node18",
    entryPoints: ["src/patcher/main.ts"],
    outfile: "dist/qqntim-patcher.js",
    external: ["electron", "original-fs"],
});
build({
    ...commonOptions,
    target: "node18",
    entryPoints: ["src/server/main.ts"],
    outfile: "dist/qqntim-server.js",
    external: [],
});

copySync("publish", "dist");
