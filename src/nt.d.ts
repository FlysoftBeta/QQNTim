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
    faceType: "normal" | "normal-extended" | "super" | number;
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
export interface Message {
    peer: Peer;
    sender: Sender;
    elements: MessageElement[];
    allDownloadedPromise: Promise<void[]>;
}
export interface Sender {
    uid: string;
    memberName?: string;
    nickName?: string;
}
export interface Peer {
    chatType: "friend" | "group" | "others";
    uid: string;
    name?: string;
}
export interface Friend {
    uid: string;
    uin: string;
    qid: string;
    avatarUrl: string;
    nickName: string;
    bio: string;
    sex: "male" | "female" | "unset" | "others";
}
export interface Group {
    uid: string;
    avatarUrl: string;
    name: string;
    role: "master" | "moderator" | "member" | "others";
    maxMembers: number;
    members: number;
}
