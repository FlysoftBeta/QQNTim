import { EventEmitter } from "events";
import TypedEmitter from "typed-emitter";
import { IPCArgs, addInterruptIpc } from "../../../ipc";
import { Friend, Group, Message, MessageElement, Peer } from "./nt";
import { constructMessage } from "./constructor";
import {
    destructFaceElement,
    destructImageElement,
    destructPeer,
    destructRawElement,
    destructTextElement,
} from "./destructor";
import { ntCall } from "./call";

type NTEvents = {
    "new-messages": (messages: Message[]) => void;
    "friends-list-updated": (list: Friend[]) => void;
    "groups-list-updated": (list: Group[]) => void;
};

class NT extends (EventEmitter as new () => TypedEmitter<NTEvents>) {
    private pendingMediaDownloads: Record<string, Function> = {};
    private pendingSentMessages: Record<string, Function> = {};
    private friendsList: Friend[] = [];
    private groupsList: Group[] = [];

    constructor() {
        super();
        this.listenMediaDownload();
        this.listenSentMessages();
        this.listenNewMessages();
        this.listenContactListChange();
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
                direction: "in",
            }
        );
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
                direction: "in",
            }
        );
    }

    private listenNewMessages() {
        addInterruptIpc(
            (args) => {
                const messages = (args[1][0].payload.msgList as any[]).map(
                    (msg): Message => constructMessage(msg, this.pendingMediaDownloads)
                );
                this.emit("new-messages", messages);
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelMsgListener/onRecvMsg",
                direction: "in",
            }
        );
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
                                    raw: friend,
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
                direction: "in",
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
                            raw: group,
                        };
                    }
                );
                this.emit("groups-list-updated", this.groupsList);
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelGroupListener/onGroupListUpdate",
                direction: "in",
            }
        );
    }

    private async prepareImageElement(file: string) {
        const type = await ntCall("ns-fsApi-2", "getFileType", [file]);
        const md5 = await ntCall("ns-fsApi-2", "getFileMd5", [file]);
        const fileName = `${md5}.${type.ext}`;
        const filePath = await ntCall(
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

    async revokeMessage(peer: Peer, message: string) {
        await ntCall("ns-ntApi-2", "nodeIKernelMsgService/recallMsg", [
            {
                peer: destructPeer(peer),
                msgIds: [message],
            },
        ]);
    }

    async sendMessage(peer: Peer, elements: MessageElement[]) {
        ntCall("ns-ntApi-2", "nodeIKernelMsgService/sendMsg", [
            {
                msgId: "0",
                peer: destructPeer(peer),
                msgElements: await Promise.all(
                    elements.map(async (element) => {
                        if (element.type == "text") return destructTextElement(element);
                        else if (element.type == "image")
                            return destructImageElement(
                                element,
                                this.prepareImageElement(element.file)
                            );
                        else if (element.type == "face")
                            return destructFaceElement(element);
                        else if (element.type == "raw")
                            return destructRawElement(element);
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

    async getFriendsList(forced: boolean) {
        ntCall("ns-ntApi-2", "nodeIKernelBuddyService/getBuddyList", [
            { force_update: forced },
            undefined,
        ]);
        return await new Promise<Friend[]>((resolve) => {
            this.once("friends-list-updated", (list) => resolve(list));
        });
    }

    async getGroupsList(forced: boolean) {
        ntCall("ns-ntApi-2", "nodeIKernelGroupService/getGroupList", [
            { forceFetch: forced },
            undefined,
        ]);
        return await new Promise<Group[]>((resolve) => {
            this.once("groups-list-updated", (list) => resolve(list));
        });
    }

    async getPreviousMessages(peer: Peer, count: number = 20, startMsgId = "0") {
        try {
            const msgs = await ntCall(
                "ns-ntApi-2",
                "nodeIKernelMsgService/getMsgsIncludeSelf",
                [
                    {
                        peer: destructPeer(peer),
                        msgId: startMsgId,
                        cnt: count,
                        queryOrder: true,
                    },
                    undefined,
                ]
            );
            const messages = (msgs.msgList as any[]).map((msg) =>
                constructMessage(msg, this.pendingMediaDownloads)
            );
            return messages;
        } catch {
            return [];
        }
    }
}

export const nt = new NT();
