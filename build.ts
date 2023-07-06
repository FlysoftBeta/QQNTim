import { BuildOptions, build } from "esbuild";
import { copySync, emptyDirSync, ensureDirSync } from "fs-extra";
import { sep as s } from "path";
import { getAllLocators, getPackageInformation } from "pnpapi";

emptyDirSync("dist");

const isProduction = process.env["NODE_ENV"] == "production";
const unpackedPackages = ["fs-extra", "chii"];
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
    external: ["electron", "./index.js", "LiteLoader", ...unpackedPackages],
});
build({
    ...commonOptions,
    entryPoints: ["src/renderer/main.ts"],
    outfile: "dist/qqntim-renderer.js",
    external: ["electron", "fs-extra", ...unpackedPackages],
});

const packages: Record<
    string,
    Record<string, { packageLocation: string; packageDependencies: Map<string, string> }>
> = {};
getAllLocators().forEach((locator) => {
    if (!packages[locator.name]) packages[locator.name] = {};
    packages[locator.name][locator.reference] = getPackageInformation(locator);
});

function unpackPackage(rootDir: string, name: string, reference?: string) {
    const item = packages[name];
    if (!item) return;
    const location = item[reference ? reference : Object.keys(item)[0]];
    const dir = `${rootDir}${s}node_modules${s}${name}`;
    ensureDirSync(dir);
    copySync(location.packageLocation, dir);
    for (const dep of location.packageDependencies) {
        if (dep[0] == name) continue;
        unpackPackage(dir, dep[0], dep[1]);
    }
}

unpackedPackages.forEach((unpackedPackage) => unpackPackage("dist", unpackedPackage));

copySync("publish", "dist");
