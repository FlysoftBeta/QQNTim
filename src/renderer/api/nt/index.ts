import { IPCArgs, addInterruptIpc } from "../../../ipc";
import { ntCall } from "./call";
import { constructMessage } from "./constructor";
import { destructFaceElement, destructImageElement, destructPeer, destructRawElement, destructTextElement } from "./destructor";
import { prepareImageElement } from "./media";
import { Friend, Group, LoginAccount, Message, MessageElement, Peer } from "./nt";
import { EventEmitter } from "events";
import TypedEmitter from "typed-emitter";

type NTEvents = {
    "new-messages": (messages: Message[]) => void;
    "friends-list-updated": (list: Friend[]) => void;
    "groups-list-updated": (list: Group[]) => void;
};

const NTEventEmitter = EventEmitter as new () => TypedEmitter<NTEvents>;
class NT extends NTEventEmitter {
    private pendingSentMessages: Record<string, Function> = {};
    private friendsList: Friend[] = [];
    private groupsList: Group[] = [];

    constructor() {
        super();
        this.listenSentMessages();
        this.listenNewMessages();
        this.listenContactListChange();
    }

    public async getAccountInfo(): Promise<LoginAccount> {
        const data = await ntCall("ns-BusinessApi-2", "fetchAuthData", []);
        return { uin: data.uin as string, uid: data.uid as string };
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
            },
        );
    }

    private listenNewMessages() {
        addInterruptIpc(
            (args) => {
                const messages = (args[1][0].payload.msgList as any[]).map((msg): Message => constructMessage(msg));
                this.emit("new-messages", messages);
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelMsgListener/onRecvMsg",
                direction: "in",
            },
        );
    }

    private listenContactListChange() {
        addInterruptIpc(
            (args) => {
                this.friendsList = [];
                ((args[1][0].payload?.data || []) as any[]).forEach((category) => {
                    this.friendsList.push(
                        ...((category?.buddyList || []) as any[]).map((friend): Friend => {
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
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelBuddyListener/onBuddyListChange",
                direction: "in",
            },
        );
        addInterruptIpc(
            (args) => {
                this.groupsList = ((args[1][0].payload?.groupList || []) as any[]).map((group): Group => {
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
            {
                type: "request",
                eventName: "ns-ntApi-2",
                cmdName: "nodeIKernelGroupListener/onGroupListUpdate",
                direction: "in",
            },
        );
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
            this.pendingSentMessages[peer.uid] = (args: IPCArgs<any>) => {
                resolve(args[1][0].payload.msgRecord.msgId);
            };
        });
    }

    async getFriendsList(forced: boolean) {
        ntCall("ns-ntApi-2", "nodeIKernelBuddyService/getBuddyList", [{ force_update: forced }, undefined]);
        return await new Promise<Friend[]>((resolve) => {
            this.once("friends-list-updated", (list) => resolve(list));
        });
    }

    async getGroupsList(forced: boolean) {
        ntCall("ns-ntApi-2", "nodeIKernelGroupService/getGroupList", [{ forceFetch: forced }, undefined]);
        return await new Promise<Group[]>((resolve) => {
            this.once("groups-list-updated", (list) => resolve(list));
        });
    }

    async getPreviousMessages(peer: Peer, count = 20, startMsgId = "0") {
        try {
            const msgs = await ntCall("ns-ntApi-2", "nodeIKernelMsgService/getMsgsIncludeSelf", [
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
