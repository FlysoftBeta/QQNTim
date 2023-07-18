import { ntCall } from "./call";
import { NTWatcher } from "./watcher";
import { exists } from "fs-extra";

class NTMedia {
    private mediaDownloadWatcher: NTWatcher<string>;
    private registerEventsPromise: Promise<void>;
    public init() {
        this.mediaDownloadWatcher = new NTWatcher((args) => args[1][0].payload?.notifyInfo?.msgElementId, "ns-ntApi", "nodeIKernelMsgListener/onRichMediaDownloadComplete", "in", "request");
        this.registerEventsPromise = ntCall("ns-ntApi", "nodeIKernelMsgListener/onRichMediaDownloadComplete", [], true);
    }
    public async prepareImageElement(file: string) {
        const type = await ntCall("ns-fsApi", "getFileType", [file]);
        const md5 = await ntCall("ns-fsApi", "getFileMd5", [file]);
        const fileName = `${md5}.${type.ext}`;
        const filePath = await ntCall("ns-ntApi", "nodeIKernelMsgService/getRichMediaFilePath", [
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
        await ntCall("ns-fsApi", "copyFile", [{ fromPath: file, toPath: filePath }]);
        const imageSize = await ntCall("ns-fsApi", "getImageSizeFromPath", [file]);
        const fileSize = await ntCall("ns-fsApi", "getFileSize", [file]);
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
    public async downloadMedia(msgId: string, elementId: string, peerUid: string, chatType: number, filePath: string, originalFilePath: string) {
        if (await exists(originalFilePath)) return;
        await this.registerEventsPromise;
        ntCall("ns-ntApi", "nodeIKernelMsgService/downloadRichMedia", [
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
        return await this.mediaDownloadWatcher.wait(elementId).then(() => undefined);
    }
}

export const ntMedia = new NTMedia();
