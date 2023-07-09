import { addInterruptIpc } from "../../../ipc";
import { ntCall } from "./call";
import { exists } from "fs-extra";

const pendingMediaDownloads: Record<string, Function> = {};

addInterruptIpc(
    (args) => {
        const id = args[1][0].payload?.notifyInfo?.msgElementId;
        if (pendingMediaDownloads[id]) {
            pendingMediaDownloads[id](args);
            delete pendingMediaDownloads[id];
            return false;
        }
    },
    {
        type: "request",
        eventName: "ns-ntApi-2",
        cmdName: "nodeIKernelMsgListener/onRichMediaDownloadComplete",
        direction: "in",
    },
);

const registerEventsPromise = (async () => {
    await ntCall("ns-ntApi-2-register", "nodeIKernelMsgListener/onRichMediaDownloadComplete", []);
})();

export async function prepareImageElement(file: string) {
    const type = await ntCall("ns-fsApi-2", "getFileType", [file]);
    const md5 = await ntCall("ns-fsApi-2", "getFileMd5", [file]);
    const fileName = `${md5}.${type.ext}`;
    const filePath = await ntCall("ns-ntApi-2", "nodeIKernelMsgService/getRichMediaFilePath", [
        {
            md5HexStr: md5,
            fileName: fileName,
            elementType: 2,
            elementSubType: 0,
            thumbSize: 0,
            needCreate: true,
            fileType: 1,
        },
    ]);
    await ntCall("ns-fsApi-2", "copyFile", [{ fromPath: file, toPath: filePath }]);
    const imageSize = await ntCall("ns-fsApi-2", "getImageSizeFromPath", [file]);
    const fileSize = await ntCall("ns-fsApi-2", "getFileSize", [file]);
    return {
        md5HexStr: md5,
        fileSize: fileSize,
        picWidth: imageSize.width,
        picHeight: imageSize.height,
        fileName: fileName,
        sourcePath: filePath,
        original: true,
        picType: 1001,
        picSubType: 0,
        fileUuid: "",
        fileSubId: "",
        thumbFileSize: 0,
        summary: "",
    };
}

export async function downloadMedia(msgId: string, elementId: string, peerUid: string, chatType: number, filePath: string, originalFilePath: string) {
    if (await exists(originalFilePath)) return;
    await registerEventsPromise;
    ntCall("ns-ntApi-2", "nodeIKernelMsgService/downloadRichMedia", [
        {
            getReq: {
                msgId: msgId,
                chatType: chatType,
                peerUid: peerUid,
                elementId: elementId,
                thumbSize: 0,
                downloadType: 2,
                filePath: filePath,
            },
        },
        undefined,
    ]);
    return await new Promise<void>((resolve) => {
        pendingMediaDownloads[elementId] = () => resolve();
    });
}
