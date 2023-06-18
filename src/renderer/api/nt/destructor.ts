import {
    MessageElementFace,
    MessageElementImage,
    MessageElementRaw,
    MessageElementText,
    Peer,
} from "./nt";

export function destructTextElement(element: MessageElementText) {
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

export function destructImageElement(element: MessageElementImage, picElement: any) {
    return {
        elementType: 2,
        elementId: "",
        picElement: picElement,
    };
}

export function destructFaceElement(element: MessageElementFace) {
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

export function destructRawElement(element: MessageElementRaw) {
    return element.raw;
}

export function destructPeer(peer: Peer) {
    return {
        chatType: peer.chatType == "friend" ? 1 : peer.chatType == "group" ? 2 : 1,
        peerUid: peer.uid,
        guildId: "",
    };
}
