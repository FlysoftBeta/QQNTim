import * as fs from "fs-extra";
import { EventEmitter } from "events";
import TypedEmitter from "typed-emitter";
import { ipcRenderer } from "electron";
import { randomUUID } from "crypto";
import {
    Message,
    MessageChatType,
    MessageElement,
    MessageElementFace,
    MessageElementImage,
    MessageElementRaw,
    MessageElementText,
} from "../nt";
import {
    IPCArgs,
    IPCResponse,
    InterruptIPC,
    InterruptIPCOptions,
    addInterruptIpc,
} from "../ipc";

class NTError extends Error {
    public code: number;
    public message: string;
    constructor(code: number, message: string) {
        super();
        this.code = code;
        this.message = message;
    }
}

type NTEvents = {
    "new-messages": (messages: Message[]) => void;
};

class NT extends (EventEmitter as new () => TypedEmitter<NTEvents>) {
    private pendingCallbacks: Record<string, Function> = {};
    private pendingMediaDownloads: Record<string, Function> = {};
    constructor() {
        super();
        this.listenCallResponse();
        this.listenMediaDownload();
        this.listenNewMessages();
    }

    private listenCallResponse() {
        addInterruptIpc((args) => {
            const id = args[0].callbackId;
            if (this.pendingCallbacks[id]) {
                this.pendingCallbacks[id](args);
                return false;
            }
        });
    }
    private call(eventName: string, cmd: string, args: any[]) {
        return new Promise<any>((resolve, reject) => {
            const uuid = randomUUID();
            this.pendingCallbacks[uuid] = (args: IPCArgs<IPCResponse>) => {
                if (args[1] && args[1].result != undefined && args[1].result != 0)
                    reject(new NTError(args[1].result, args[1].errMsg));
                else resolve(args[1]);
            };
            ipcRenderer.send(
                "IPC_UP_2",
                {
                    type: "request",
                    callbackId: uuid,
                    eventName: eventName,
                },
                [cmd, ...args]
            );
        });
    }

    private constructTextElement(ele: any): MessageElementText {
        return {
            type: "text",
            content: ele.textElement.content,
            raw: ele,
        };
    }
    private constructImageElement(ele: any): MessageElementImage {
        return {
            type: "image",
            file: ele.picElement.sourcePath,
            downloadedPromise: new Promise<void>((resolve, reject) => {
                this.pendingMediaDownloads[ele.elementId] = () => {
                    resolve();
                };
            }),
            raw: ele,
        };
    }
    private constructFaceElement(ele: any): MessageElementFace {
        return {
            type: "face",
            faceIndex: ele.faceElement.faceIndex,
            faceType:
                ele.faceElement.faceType == 1
                    ? "normal"
                    : ele.faceElement.faceType == 3
                    ? "super"
                    : "unknown",
            faceSuperIndex:
                ele.faceElement.stickerId && parseInt(ele.faceElement.stickerId),
            raw: ele,
        };
    }
    private constructRawElement(ele: any): MessageElementRaw {
        return {
            type: "raw",
            raw: ele,
        };
    }
    private listenNewMessages() {
        addInterruptIpc(
            (args) => {
                const messages = (args[1][0].payload.msgList as any[]).map(
                    (msg): Message => {
                        const downloadedPromises: Promise<void>[] = [];
                        const elements = (msg.elements as any[]).map(
                            (ele): MessageElement => {
                                if (ele.elementType == 1)
                                    return this.constructTextElement(ele);
                                else if (ele.elementType == 2) {
                                    const element = this.constructImageElement(ele);
                                    downloadedPromises.push(element.downloadedPromise);
                                    return element;
                                } else if (ele.elementType == 6)
                                    return this.constructFaceElement(ele);
                                else return this.constructRawElement(ele);
                            }
                        );
                        return {
                            allDownloadedPromise: Promise.all(downloadedPromises),
                            peer: {
                                uid: msg.peerUid,
                                name: msg.peerName,
                            },
                            sender: {
                                uid: msg.senderUid,
                                memberName: msg.sendMemberName || msg.sendNickName,
                                nickName: msg.sendNickName,
                            },
                            elements: elements,
                            chatType:
                                msg.chatType == 1
                                    ? "friend"
                                    : msg.chatType == 2
                                    ? "group"
                                    : "others",
                        };
                    }
                );
                this.emit("new-messages", messages);
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelMsgListener/onRecvMsg",
            }
        );
    }
    private listenMediaDownload() {
        addInterruptIpc(
            (args) => {
                const id = args[1][0].payload?.notifyInfo?.msgElementId;
                if (this.pendingMediaDownloads[id]) this.pendingMediaDownloads[id](args);
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelMsgListener/onRichMediaDownloadComplete",
            }
        );
    }

    private async prepareImageElement(file: string) {
        const type = await this.call("ns-fsApi-2", "getFileType", [file]);
        const md5 = await this.call("ns-fsApi-2", "getFileMd5", [file]);
        const fileName = `${md5}.${type.ext}`;
        const filePath = await this.call(
            "ns-ntApi-2",
            "nodeIKernelMsgService/getRichMediaFilePath",
            [
                {
                    md5HexStr: md5,
                    fileName: fileName,
                    elementType: 2,
                    elementSubType: 0,
                    thumbSize: 0,
                    needCreate: true,
                    fileType: 1,
                },
            ]
        );
        await this.call("ns-fsApi-2", "copyFile", [{ fromPath: file, toPath: filePath }]);
        const imageSize = await this.call("ns-fsApi-2", "getImageSizeFromPath", [file]);
        const fileSize = await this.call("ns-fsApi-2", "getFileSize", [file]);
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
    private async destructTextElement(element: MessageElementText) {
        return {
            elementType: 1,
            elementId: "",
            textElement: {
                content: element.content,
                atType: 0,
                atUid: "",
                atTinyId: "",
                atNtUid: "",
            },
        };
    }
    private async destructImageElement(element: MessageElementImage) {
        return {
            elementType: 2,
            elementId: "",
            picElement: await this.prepareImageElement(element.file),
        };
    }
    private async destructFaceElement(element: MessageElementFace) {
        return {
            elementType: 6,
            elementId: "",
            faceElement: {
                faceIndex: element.faceIndex,
                faceType:
                    element.faceType == "normal"
                        ? 1
                        : element.faceType == "super"
                        ? 3
                        : 1,
                ...(element.faceType == "super" && {
                    packId: "1",
                    stickerId: (element.faceSuperIndex || "0").toString(),
                    stickerType: 1,
                    sourceType: 1,
                    resultId: "",
                    superisedId: "",
                    randomType: 1,
                }),
            },
        };
    }
    private async destructRawElement(element: MessageElementRaw) {
        return element.raw;
    }
    async sendMessage(
        chatType: MessageChatType,
        peerUid: string,
        elements: MessageElement[]
    ) {
        await this.call("ns-ntApi-2", "nodeIKernelMsgService/sendMsg", [
            {
                msgId: "0",
                peer: {
                    chatType: chatType == "friend" ? 1 : chatType == "group" ? 2 : 1,
                    peerUid: peerUid,
                    guildId: "",
                },
                msgElements: await Promise.all(
                    elements.map(async (element) => {
                        if (element.type == "text")
                            return this.destructTextElement(element);
                        else if (element.type == "image")
                            return this.destructImageElement(element);
                        else if (element.type == "face")
                            return this.destructFaceElement(element);
                        else if (element.type == "raw")
                            return this.destructRawElement(element);
                        else return null;
                    })
                ),
            },
            null,
        ]);
    }
}

const waitForElementSelectors: [string, (element: HTMLElement) => void][] = [];

export function refreshWaitForElementStatus() {
    waitForElementSelectors.forEach((item, idx) => {
        const ele = document.querySelector<HTMLElement>(item[0]);
        if (ele) {
            item[1](ele);
            waitForElementSelectors.splice(idx);
        }
    });
}

export function getAPI(windowLoadPromise: Promise<void>) {
    const nt = new NT();

    return {
        interrupt: {
            ipc: (func: InterruptIPC, options?: InterruptIPCOptions) =>
                addInterruptIpc(func, options),
        },
        nt: nt,
        modules: {
            fs: fs,
        },
        utils: {
            waitForElement: (selector: string) => {
                return new Promise<HTMLElement>((resolve) => {
                    waitForElementSelectors.push([
                        selector,
                        (element) => {
                            resolve(element);
                        },
                    ]);
                    refreshWaitForElementStatus();
                });
            },
        },
        windowLoadPromise: windowLoadPromise,
    };
}

addInterruptIpc((args) => {
    console.log(JSON.stringify(args));
});
