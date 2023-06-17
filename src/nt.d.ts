export interface MessageElementBase {
    raw: object;
}
export interface MessageElementText extends MessageElementBase {
    type: "text";
    content: string;
}
export interface MessageElementImage extends MessageElementBase {
    type: "image";
    file: string;
    downloadedPromise: Promise<void>;
}
export interface MessageElementFace extends MessageElementBase {
    type: "face";
    faceIndex: number;
    faceType: "normal" | "super" | "unknown";
    faceSuperIndex?: number;
}
export interface MessageElementRaw extends MessageElementBase {
    type: "raw";
}
export type MessageElement =
    | MessageElementText
    | MessageElementImage
    | MessageElementFace
    | MessageElementRaw;
export type MessageElementSend =
    | Omit<MessageElementText, "raw">
    | Omit<MessageElementImage, "raw">
    | Omit<Omit<MessageElementFace, "raw">, "downloadPromise">
    | MessageElementRaw;
export type MessageChatType = "friend" | "group" | "others";
export interface Message {
    peer: {
        uid: string;
        name: string;
    };
    sender: {
        uid: string;
        memberName: string;
        nickName: string;
    };
    chatType: MessageChatType;
    elements: MessageElement[];
    allDownloadedPromise: Promise<void[]>;
}
