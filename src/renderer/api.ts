import * as fs from "fs-extra";
import { EventEmitter } from "events";
import TypedEmitter from "typed-emitter";
import { ipcRenderer } from "electron";
import { randomUUID } from "crypto";
import {
    Friend,
    Group,
    Message,
    MessageElement,
    MessageElementFace,
    MessageElementImage,
    MessageElementRaw,
    MessageElementText,
    Peer,
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
    "friends-list-updated": (list: Friend[]) => void;
    "groups-list-updated": (list: Group[]) => void;
};

class NT extends (EventEmitter as new () => TypedEmitter<NTEvents>) {
    private pendingCallbacks: Record<string, Function> = {};
    private pendingMediaDownloads: Record<string, Function> = {};
    private pendingSentMessages: Record<string, Function> = {};
    private friendsList: Friend[] = [];
    private groupsList: Group[] = [];
    constructor() {
        super();
        this.listenCallResponse();
        this.listenContactListChange();
        this.listenMediaDownload();
        this.listenSentMessages();
        this.listenNewMessages();
    }

    private listenCallResponse() {
        addInterruptIpc((args) => {
            const id = args[0].callbackId;
            if (this.pendingCallbacks[id]) {
                this.pendingCallbacks[id](args);
                delete this.pendingCallbacks[id];
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
                    : ele.faceElement.faceType == 2
                    ? "normal-extended"
                    : ele.faceElement.faceType == 3
                    ? "super"
                    : ele.faceElement.faceType,
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
                                chatType:
                                    msg.chatType == 1
                                        ? "friend"
                                        : msg.chatType == 2
                                        ? "group"
                                        : "others",
                            },
                            sender: {
                                uid: msg.senderUid,
                                memberName: msg.sendMemberName || msg.sendNickName,
                                nickName: msg.sendNickName,
                            },
                            elements: elements,
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
                if (this.pendingMediaDownloads[id]) {
                    this.pendingMediaDownloads[id](args);
                    delete this.pendingMediaDownloads[id];
                }
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
                        : element.faceType == "normal-extended"
                        ? 2
                        : element.faceType == "super"
                        ? 3
                        : element.faceType,
                ...((element.faceType == "super" || element.faceType == 3) && {
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
    private destructPeer(peer: Peer) {
        return {
            chatType: peer.chatType == "friend" ? 1 : peer.chatType == "group" ? 2 : 1,
            peerUid: peer.uid,
            guildId: "",
        };
    }
    async revokeMessage(peer: Peer, message: string) {
        await this.call("ns-ntApi-2", "nodeIKernelMsgService/recallMsg", [
            {
                peer: this.destructPeer(peer),
                msgIds: [message],
            },
        ]);
    }
    private listenSentMessages() {
        addInterruptIpc(
            (args) => {
                const id = args[1][0].payload.msgRecord.peerUid;
                if (this.pendingSentMessages[id]) {
                    this.pendingSentMessages[id](args);
                    delete this.pendingSentMessages[id];
                    return false;
                }
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelMsgListener/onAddSendMsg",
            }
        );
    }
    async sendMessage(peer: Peer, elements: MessageElement[]) {
        this.call("ns-ntApi-2", "nodeIKernelMsgService/sendMsg", [
            {
                msgId: "0",
                peer: this.destructPeer(peer),
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
        return await new Promise<string>((resolve) => {
            this.pendingSentMessages[peer.uid] = (args: IPCArgs<any>) => {
                resolve(args[1][0].payload.msgRecord.msgId);
            };
        });
    }

    private listenContactListChange() {
        addInterruptIpc(
            (args) => {
                this.friendsList = [];
                ((args[1][0].payload?.data || []) as any[]).forEach((category) => {
                    this.friendsList.push(
                        ...((category?.buddyList || []) as any[]).map(
                            (friend): Friend => {
                                return {
                                    uid: friend.uid,
                                    qid: friend.qid,
                                    uin: friend.uin,
                                    avatarUrl: friend.avatarUrl,
                                    nickName: friend.nick,
                                    bio: friend.longNick,
                                    sex:
                                        friend.sex == 1
                                            ? "male"
                                            : friend.sex == 2
                                            ? "female"
                                            : friend.sex == 255 || friend.sex == 0
                                            ? "unset"
                                            : "others",
                                };
                            }
                        )
                    );
                });
                this.emit("friends-list-updated", this.friendsList);
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelBuddyListener/onBuddyListChange",
            }
        );
        addInterruptIpc(
            (args) => {
                this.groupsList = ((args[1][0].payload?.groupList || []) as any[]).map(
                    (group): Group => {
                        return {
                            uid: group.groupCode,
                            avatarUrl: group.avatarUrl,
                            name: group.groupName,
                            role:
                                group.memberRole == 4
                                    ? "master"
                                    : group.memberRole == 3
                                    ? "moderator"
                                    : group.memberRole == 2
                                    ? "member"
                                    : "others",
                            maxMembers: group.maxMember,
                            members: group.memberCount,
                        };
                    }
                );
                this.emit("groups-list-updated", this.groupsList);
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelGroupListener/onGroupListUpdate",
            }
        );
    }
    async getFriendsList(forced: boolean) {
        this.call("ns-ntApi-2", "nodeIKernelBuddyService/getBuddyList", [
            { force_update: forced },
            undefined,
        ]);
        return await new Promise<Friend[]>((resolve) => {
            this.once("friends-list-updated", (list) => resolve(list));
        });
    }
    async getGroupsList(forced: boolean) {
        this.call("ns-ntApi-2", "nodeIKernelGroupService/getGroupList", [
            { forceFetch: forced },
            undefined,
        ]);
        return await new Promise<Group[]>((resolve) => {
            this.once("groups-list-updated", (list) => resolve(list));
        });
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
