export interface MessageElementText {
    type: "text";
    content: string;
}
export interface MessageElementRaw {
    type: "raw";
    raw: object;
}
export type MessageElement = MessageElementText | MessageElementRaw;
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
}
