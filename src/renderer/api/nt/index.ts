import { ntCall } from "./call";
import { constructGroup, constructMessage, constructUser } from "./constructor";
import { destructFaceElement, destructImageElement, destructPeer, destructRawElement, destructTextElement } from "./destructor";
import { ntInterrupt } from "./interrupt";
import { ntMedia } from "./media";
import { NTWatcher } from "./watcher";
import { QQNTim } from "@flysoftbeta/qqntim-typings";
import { EventEmitter } from "events";

const NTEventEmitter = EventEmitter as new () => QQNTim.API.Renderer.NT.EventEmitter;
class NT extends NTEventEmitter implements QQNTim.API.Renderer.NT.NT {
    private sentMessageWatcher: NTWatcher<string>;
    private profileChangeWatcher: NTWatcher<string>;
    private friendsList: QQNTim.API.Renderer.NT.User[] = [];
    private groupsList: QQNTim.API.Renderer.NT.Group[] = [];

    public init() {
        this.listenNewMessages();
        this.listenContactListChange();
        ntMedia.init();
        this.sentMessageWatcher = new NTWatcher((args) => args?.[1]?.[0]?.payload?.msgRecord?.peerUid, "ns-ntApi", "nodeIKernelMsgListener/onAddSendMsg", "in", "request");
        this.profileChangeWatcher = new NTWatcher((args) => args?.[1]?.[0]?.payload?.profiles?.keys()?.next()?.value, "ns-ntApi", "nodeIKernelProfileListener/onProfileSimpleChanged", "in", "request");
    }

    private listenNewMessages() {
        ntInterrupt(
            (args) => {
                const messages = (args?.[1]?.[0]?.payload?.msgList as any[]).map((msg): QQNTim.API.Renderer.NT.Message => constructMessage(msg));
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
                ((args?.[1]?.[0]?.payload?.data || []) as any[]).forEach((category) => this.friendsList.push(...((category?.buddyList || []) as any[]).map((friend) => constructUser(friend))));
                this.emit("friends-list-updated", this.friendsList);
            },
            "ns-ntApi",
            "nodeIKernelBuddyListener/onBuddyListChange",
            "in",
            "request",
        );
        ntInterrupt(
            (args) => {
                this.groupsList = ((args[1]?.[0]?.payload?.groupList || []) as any[]).map((group) => constructGroup(group));
                this.emit("groups-list-updated", this.groupsList);
            },
            "ns-ntApi",
            "nodeIKernelGroupListener/onGroupListUpdate",
            "in",
            "request",
        );
    }

    async getAccountInfo(): Promise<QQNTim.API.Renderer.NT.LoginAccount | undefined> {
        return await ntCall("ns-BusinessApi", "fetchAuthData", []).then((data) => {
            if (!data) return;
            return { uid: data.uid, uin: data.uin } as QQNTim.API.Renderer.NT.LoginAccount;
        });
    }

    async getUserInfo(uid: string): Promise<QQNTim.API.Renderer.NT.User> {
        ntCall("ns-ntApi", "nodeIKernelProfileService/getUserDetailInfo", [{ uid: uid }, undefined]);
        return await this.profileChangeWatcher.wait(uid).then((args) => constructUser(args?.[1]?.[0]?.payload?.profiles?.get(uid)));
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
                        else if (element.type == "image") return destructImageElement(element, await ntMedia.prepareImageElement(element.file));
                        else if (element.type == "face") return destructFaceElement(element);
                        else if (element.type == "raw") return destructRawElement(element);
                        else return null;
                    }),
                ),
            },
            null,
        ]);
        return await this.sentMessageWatcher.wait(peer.uid).then((args) => args?.[1]?.[0]?.payload?.msgRecord?.msgId);
    }

    async getFriendsList(forced: boolean) {
        ntCall("ns-ntApi", "nodeIKernelBuddyService/getBuddyList", [{ force_update: forced }, undefined]);
        return await new Promise<QQNTim.API.Renderer.NT.User[]>((resolve) => {
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
