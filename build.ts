import { BuildOptions, build } from "esbuild";
import { copy, emptyDir, ensureDir, readdir, writeFile } from "fs-extra";
import { dirname, sep as s } from "path";
import { getAllLocators, getPackageInformation } from "pnpapi";

type Package = {
    packageLocation: string;
    packageDependencies: Map<string, string>;
};
type Packages = Record<string, Record<string, Package>>;

const unpackedPackages = ["chii"];
const junkFiles = [
    ".d.ts",
    ".markdown",
    ".md",
    "/.eslintrc",
    "/.eslintrc.js",
    "/.prettierrc",
    "/.nycrc",
    ".yml",
    ".yaml",
    ".bak",
    "/.editorconfig",
    "/bower.json",
    "/.jscs.json",
    "/AUTHORS",
    "/LICENSE",
    "/License",
    "/yarn.lock",
    "/package-lock.json",
    ".map",
    ".debug.js",
    ".min.js",
    ".test.js",
    "/test/",
    "/bin/",
    "/tests/",
    "/.github/",
];

const isProduction = process.env["NODE_ENV"] == "production";
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

async function buildBundles() {
    const buildPromise = Promise.all([
        build({
            ...commonOptions,
            entryPoints: [`src${s}main${s}main.ts`],
            outfile: `dist${s}_${s}qqntim.js`,
            external: ["electron", "./index.js", ...unpackedPackages],
        }),
        build({
            ...commonOptions,
            entryPoints: [`src${s}renderer${s}main.ts`],
            outfile: `dist${s}_${s}qqntim-renderer.js`,
            external: ["electron", ...unpackedPackages],
        }),
    ]);

    return await buildPromise;
}

async function buildBuiltinPlugins() {
    const rootDir = `src${s}builtins`;
    const pluginsDir = await readdir(rootDir);
    await Promise.all(
        pluginsDir.map(async (dir) => {
            const pluginDir = `${rootDir}${s}${dir}`;
            const distDir = `dist${s}_${s}builtins${s}${dir}`;
            await ensureDir(pluginDir);
            await build({
                ...commonOptions,
                entryPoints: [`${pluginDir}${s}src${s}main.ts`, `${pluginDir}${s}src${s}renderer.ts`],
                outdir: distDir,
                external: ["electron", "react", "react/jsx-runtime", "react-dom", "react-dom/client", "qqntim/main", "qqntim/renderer"],
                format: "cjs",
            });
            await copy(`${pluginDir}${s}publish`, `${distDir}`);
        }),
    );
}

async function prepareDistDir() {
    await emptyDir("dist");
    await ensureDir(`dist${s}_`);
    await copy("publish", "dist");
}

function collectDeps() {
    const packages: Packages = {};
    getAllLocators().forEach((locator) => {
        if (!packages[locator.name]) packages[locator.name] = {};
        packages[locator.name][locator.reference] = getPackageInformation(locator);
    });
    return packages;
}

async function unpackPackage(packages: Packages, rootDir: string, name: string, reference?: string) {
    const item = packages[name];
    if (!item) return;
    const location = item[reference ? reference : Object.keys(item)[0]];
    const dir = `${rootDir}${s}node_modules${s}${name}`;
    await ensureDir(dir);
    await copy(location.packageLocation, dir, {
        filter: (src) => {
            for (const file of junkFiles) {
                if (src.includes(file)) return false;
            }
            return true;
        },
    });
    const promises: Promise<void>[] = [];
    location.packageDependencies.forEach((depReference, depName) => {
        if (name == depName) return;
        promises.push(unpackPackage(packages, dir, depName, depReference));
    });
    await Promise.all(promises);
}

const packages = collectDeps();
prepareDistDir().then(() => Promise.all([buildBundles(), buildBuiltinPlugins(), Promise.all(unpackedPackages.map((unpackedPackage) => unpackPackage(packages, `dist${s}_`, unpackedPackage)))]));
