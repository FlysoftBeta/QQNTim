import { ntCall } from "./call";
import { constructMessage } from "./constructor";
import { destructFaceElement, destructImageElement, destructPeer, destructRawElement, destructTextElement } from "./destructor";
import { ntInterrupt } from "./interrupt";
import { prepareImageElement } from "./media";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import { EventEmitter } from "events";

const NTEventEmitter = EventEmitter as new () => QQNTim.API.Renderer.NT.EventEmitter;
class NT extends NTEventEmitter implements QQNTim.API.Renderer.NT.NT {
    private pendingSentMessages: Record<string, Function> = {};
    private friendsList: QQNTim.API.Renderer.NT.Friend[] = [];
    private groupsList: QQNTim.API.Renderer.NT.Group[] = [];

    constructor() {
        super();
        this.listenSentMessages();
        this.listenNewMessages();
        this.listenContactListChange();
    }

    public async getAccountInfo(): Promise<QQNTim.API.Renderer.NT.LoginAccount | undefined> {
        return await ntCall("ns-BusinessApi", "fetchAuthData", []).then((data) => {
            if (!data) return;
            return { uid: data.uid, uin: data.uin } as QQNTim.API.Renderer.NT.LoginAccount;
        });
    }

    private listenSentMessages() {
        ntInterrupt(
            (args) => {
                const id = args[1][0].payload.msgRecord.peerUid;
                if (this.pendingSentMessages[id]) {
                    this.pendingSentMessages[id](args);
                    delete this.pendingSentMessages[id];
                    return false;
                }
            },
            "ns-ntApi",
            "nodeIKernelMsgListener/onAddSendMsg",
            "in",
            "request",
        );
    }

    private listenNewMessages() {
        ntInterrupt(
            (args) => {
                const messages = (args[1][0].payload.msgList as any[]).map((msg): QQNTim.API.Renderer.NT.Message => constructMessage(msg));
                this.emit("new-messages", messages);
            },
            "ns-ntApi",
            "nodeIKernelMsgListener/onRecvMsg",
            "in",
            "request",
        );
    }

    private listenContactListChange() {
        ntInterrupt(
            (args) => {
                this.friendsList = [];
                ((args[1][0].payload?.data || []) as any[]).forEach((category) => {
                    this.friendsList.push(
                        ...((category?.buddyList || []) as any[]).map((friend): QQNTim.API.Renderer.NT.Friend => {
                            return {
                                uid: friend.uid,
                                qid: friend.qid,
                                uin: friend.uin,
                                avatarUrl: friend.avatarUrl,
                                nickName: friend.nick,
                                bio: friend.longNick,
                                sex: friend.sex == 1 ? "male" : friend.sex == 2 ? "female" : friend.sex == 255 || friend.sex == 0 ? "unset" : "others",
                                raw: friend,
                            };
                        }),
                    );
                });
                this.emit("friends-list-updated", this.friendsList);
            },
            "ns-ntApi",
            "nodeIKernelBuddyListener/onBuddyListChange",
            "in",
            "request",
        );
        ntInterrupt(
            (args) => {
                this.groupsList = ((args[1][0].payload?.groupList || []) as any[]).map((group): QQNTim.API.Renderer.NT.Group => {
                    return {
                        uid: group.groupCode,
                        avatarUrl: group.avatarUrl,
                        name: group.groupName,
                        role: group.memberRole == 4 ? "master" : group.memberRole == 3 ? "moderator" : group.memberRole == 2 ? "member" : "others",
                        maxMembers: group.maxMember,
                        members: group.memberCount,
                        raw: group,
                    };
                });
                this.emit("groups-list-updated", this.groupsList);
            },
            "ns-ntApi",
            "nodeIKernelGroupListener/onGroupListUpdate",
            "in",
            "request",
        );
    }

    async revokeMessage(peer: QQNTim.API.Renderer.NT.Peer, message: string) {
        await ntCall("ns-ntApi", "nodeIKernelMsgService/recallMsg", [
            {
                peer: destructPeer(peer),
                msgIds: [message],
            },
        ]);
    }

    async sendMessage(peer: QQNTim.API.Renderer.NT.Peer, elements: QQNTim.API.Renderer.NT.MessageElement[]) {
        ntCall("ns-ntApi", "nodeIKernelMsgService/sendMsg", [
            {
                msgId: "0",
                peer: destructPeer(peer),
                msgElements: await Promise.all(
                    elements.map(async (element) => {
                        if (element.type == "text") return destructTextElement(element);
                        else if (element.type == "image") return destructImageElement(element, await prepareImageElement(element.file));
                        else if (element.type == "face") return destructFaceElement(element);
                        else if (element.type == "raw") return destructRawElement(element);
                        else return null;
                    }),
                ),
            },
            null,
        ]);
        return await new Promise<string>((resolve) => {
            this.pendingSentMessages[peer.uid] = (args: QQNTim.IPC.Args<any>) => {
                resolve(args[1][0].payload.msgRecord.msgId);
            };
        });
    }

    async getFriendsList(forced: boolean) {
        ntCall("ns-ntApi", "nodeIKernelBuddyService/getBuddyList", [{ force_update: forced }, undefined]);
        return await new Promise<QQNTim.API.Renderer.NT.Friend[]>((resolve) => {
            this.once("friends-list-updated", (list) => resolve(list));
        });
    }

    async getGroupsList(forced: boolean) {
        ntCall("ns-ntApi", "nodeIKernelGroupService/getGroupList", [{ forceFetch: forced }, undefined]);
        return await new Promise<QQNTim.API.Renderer.NT.Group[]>((resolve) => {
            this.once("groups-list-updated", (list) => resolve(list));
        });
    }

    async getPreviousMessages(peer: QQNTim.API.Renderer.NT.Peer, count = 20, startMsgId = "0") {
        try {
            const msgs = await ntCall("ns-ntApi", "nodeIKernelMsgService/getMsgsIncludeSelf", [
                {
                    peer: destructPeer(peer),
                    msgId: startMsgId,
                    cnt: count,
                    queryOrder: true,
                },
                undefined,
            ]);
            const messages = (msgs.msgList as any[]).map((msg) => constructMessage(msg));
            return messages;
        } catch {
            return [];
        }
    }
}

export const nt = new NT();
