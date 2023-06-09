import { execSync } from "child_process";
import { BuildOptions, build } from "esbuild";
import { copySync, emptyDirSync } from "fs-extra";

const isProduction = process.env["NODE_ENV"] == "production";

emptyDirSync("dist");

const commonOptions: Partial<BuildOptions> = {
    bundle: true,
    platform: "node",
    write: true,
    allowOverwrite: true,
    sourcemap: isProduction ? false : "linked",
    minify: isProduction,
    treeShaking: isProduction,
};

build({
    ...commonOptions,
    target: "node18",
    entryPoints: ["src/main/main.ts"],
    outfile: "dist/qqntim.js",
    external: ["electron"],
});
build({
    ...commonOptions,
    target: "node18",
    entryPoints: ["src/renderer/main.ts"],
    outfile: "dist/qqntim-renderer.js",
    external: ["electron", "./major.node", "../major.node"],
});

if (isProduction) copySync("publish", "dist");
