import * as fs from "fs-extra";
import * as path from "path";
import { createPackage } from "@electron/asar";
import { ipcRenderer } from "electron";
import { getCurrentNTResourceDir } from "../ntResourceDir";

const s = path.sep;

async function repackAsar(asarFilePath: string) {
    const asarUnpackDir = `${asarFilePath}.tmp`;
    const asarRootDir = asarFilePath;

    fs.ensureDirSync(asarUnpackDir);
    fs.emptyDirSync(asarUnpackDir);

    const iter = async (rootDir: string, unpackedRootDir: string) => {
        fs.ensureDirSync(unpackedRootDir);
        const files = ipcRenderer.sendSync(
            "___!eval",
            {
                eventName: "QQNTIM_EVAL",
            },
            `require("fs").readdirSync(${JSON.stringify(rootDir)})`
        );
        for (const fileName of files) {
            const filePath = `${rootDir}${s}${fileName}`,
                unpackedFilePath = `${unpackedRootDir}${s}${fileName}`;
            if (
                ipcRenderer.sendSync(
                    "___!eval",
                    {
                        eventName: "QQNTIM_EVAL",
                    },
                    `require("fs").statSync(${JSON.stringify(filePath)}).isDirectory()`
                )
            )
                await iter(filePath, unpackedFilePath);
            else
                fs.writeFileSync(
                    unpackedFilePath,
                    Buffer.from(
                        await (
                            await fetch(
                                "app://" +
                                    filePath
                                        .replace(asarRootDir, ".")
                                        .replace(path.sep, "/")
                            )
                        ).arrayBuffer()
                    )
                );
        }
    };

    await iter(asarRootDir, asarUnpackDir);

    fs.remove(asarFilePath);
    await createPackage(asarUnpackDir, asarFilePath);

    await fs.remove(asarUnpackDir);
}

async function repackCurrentNTResourceFile() {
    const asarFilePath = `${getCurrentNTResourceDir()}${s}application.asar`;
    if (!fs.exists(asarFilePath)) throw new Error("cannot find QQNT package");
    await repackAsar(asarFilePath);
}

repackCurrentNTResourceFile()
    .then(() => {
        ipcRenderer.sendSync("___!ok", {
            eventName: "QQNTIM_PATCHER",
        });
    })
    .catch((reason) => {
        ipcRenderer.sendSync(
            "___!fail",
            {
                eventName: "QQNTIM_PATCHER",
            },
            reason
        );
    });
