import { ntMedia } from "./media";

export function constructTextElement(ele: any): QQNTim.API.Renderer.NT.MessageElementText {
    return {
        type: "text",
        content: ele.textElement.content,
        raw: ele,
    };
}

export function constructImageElement(ele: any, msg: any): QQNTim.API.Renderer.NT.MessageElementImage {
    return {
        type: "image",
        file: ele.picElement.sourcePath,
        downloadedPromise: ntMedia.downloadMedia(msg.msgId, ele.elementId, msg.peerUid, msg.chatType, ele.picElement.thumbPath.get(0), ele.picElement.sourcePath),
        raw: ele,
    };
}
export function constructFaceElement(ele: any): QQNTim.API.Renderer.NT.MessageElementFace {
    return {
        type: "face",
        faceIndex: ele.faceElement.faceIndex,
        faceType: ele.faceElement.faceType == 1 ? "normal" : ele.faceElement.faceType == 2 ? "normal-extended" : ele.faceElement.faceType == 3 ? "super" : ele.faceElement.faceType,
        faceSuperIndex: ele.faceElement.stickerId && parseInt(ele.faceElement.stickerId),
        raw: ele,
    };
}
export function constructRawElement(ele: any): QQNTim.API.Renderer.NT.MessageElementRaw {
    return {
        type: "raw",
        raw: ele,
    };
}
export function constructMessage(msg: any): QQNTim.API.Renderer.NT.Message {
    const downloadedPromises: Promise<void>[] = [];
    const elements = (msg.elements as any[]).map((ele): QQNTim.API.Renderer.NT.MessageElement => {
        if (ele.elementType == 1) return constructTextElement(ele);
        else if (ele.elementType == 2) {
            const element = constructImageElement(ele, msg);
            downloadedPromises.push(element.downloadedPromise);
            return element;
        } else if (ele.elementType == 6) return constructFaceElement(ele);
        else return constructRawElement(ele);
    });
    return {
        allDownloadedPromise: Promise.all(downloadedPromises),
        peer: {
            uid: msg.peerUid,
            name: msg.peerName,
            chatType: msg.chatType == 1 ? "friend" : msg.chatType == 2 ? "group" : "others",
        },
        sender: {
            uid: msg.senderUid,
            memberName: msg.sendMemberName || msg.sendNickName,
            nickName: msg.sendNickName,
        },
        elements: elements,
        raw: msg,
    };
}
export function constructUser(user: any): QQNTim.API.Renderer.NT.User {
    return {
        uid: user.uid,
        qid: user.qid,
        uin: user.uin,
        avatarUrl: user.avatarUrl,
        nickName: user.nick,
        bio: user.longNick,
        sex: { 1: "male", 2: "female", 255: "unset", 0: "unset" }[user.sex] || "others",
        raw: user,
    };
}
export function constructGroup(group: any): QQNTim.API.Renderer.NT.Group {
    return {
        uid: group.groupCode,
        avatarUrl: group.avatarUrl,
        name: group.groupName,
        role: { 4: "master", 3: "moderator", 2: "member" }[group.memberRole] || "others",
        maxMembers: group.maxMember,
        members: group.memberCount,
        raw: group,
    };
}
