import * as fs from "fs-extra";
import { EventEmitter } from "events";
import TypedEmitter from "typed-emitter";
import { ipcRenderer } from "electron";
import { randomUUID } from "crypto";
import { Message, MessageChatType, MessageElement } from "../nt";
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
    constructor() {
        super();
        this.listenNtCallResponse();
        this.listenNewMessages();
    }

    private listenNtCallResponse() {
        addInterruptIpc(
            (args) => {
                if (this.pendingCallbacks[args[0].callbackId]) {
                    this.pendingCallbacks[args[0].callbackId](args);
                    return false;
                }
            },
            {
                type: "request",
                eventName: "ns-ntApi-2",
            }
        );
    }
    private ntCall(cmd: string, args: any) {
        return new Promise<void>((resolve, reject) => {
            const uuid = randomUUID();
            this.pendingCallbacks[uuid] = (args: IPCArgs<IPCResponse>) => {
                if (args[1] && args[1].result != 0)
                    reject(new NTError(args[1].result, args[1].errMsg));
                else resolve();
            };
            ipcRenderer.send(
                "IPC_UP_2",
                {
                    type: "request",
                    callbackId: uuid,
                    eventName: "ns-ntApi-2",
                },
                [cmd, args, null]
            );
        });
    }

    private listenNewMessages() {
        addInterruptIpc(
            (args) => {
                const messages = (args[1][0].payload.msgList as any[]).map(
                    (msg): Message => {
                        const elements = (msg.elements as any[]).map(
                            (ele): MessageElement => {
                                if (ele.elementType == 1)
                                    return {
                                        type: "text",
                                        content: ele.textElement.content,
                                    };
                                else
                                    return {
                                        type: "raw",
                                        raw: ele,
                                    };
                            }
                        );
                        return {
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
    sendMessage(chatType: MessageChatType, peerUid: string, elements: MessageElement[]) {
        return this.ntCall("nodeIKernelMsgService/sendMsg", {
            msgId: "0",
            peer: {
                chatType: chatType == "friend" ? 1 : chatType == "group" ? 2 : 1,
                peerUid: peerUid,
                guildId: "",
            },
            msgElements: elements.map((element) => {
                if (element.type == "text")
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
                else if (element.type == "raw") return element.raw;
                else return null;
            }),
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
