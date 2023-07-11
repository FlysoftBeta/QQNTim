const path = require("path");

module.exports.default = class Entry {
    constructor(qqntim) {
        //#region 示例：获取当前账号
        qqntim.nt.getAccountInfo().then((account) => {
            console.log("[Example-NT-API] 当前账号信息", account);
        });
        //#endregion

        //#region 示例：获取好友和群的最近 20 条历史消息
        qqntim.nt.getFriendsList().then((list) => {
            console.log("[Example-NT-API] 好友列表", list);
            list.forEach((friend) => qqntim.nt.getPreviousMessages({ chatType: "friend", uid: friend.uid }, 20).then((messages) => qqntim.nt.getUserInfo(friend.uid).then((user) => console.log("[Example-NT-API] 好友", user, "的最近 20 条消息", messages))));
        });
        qqntim.nt.getGroupsList().then((list) => {
            console.log("[Example-NT-API] 群组列表", list);
            list.forEach((group) => qqntim.nt.getPreviousMessages({ chatType: "group", uid: group.uid }, 20).then((messages) => console.log(`[Example-NT-API] 群组 ${group.name} (${group.uid}) 的最近 20 条消息`, messages)));
        });
        //#endregion

        //#region 示例：自动回复
        qqntim.nt.on("new-messages", (messages) => {
            console.log("[Example-NT-API] 收到新消息", messages);
            messages.forEach((message) => {
                if (message.peer.chatType != "friend") return;
                message.allDownloadedPromise.then(() => {
                    qqntim.nt
                        .sendMessage(message.peer, [
                            {
                                type: "text",
                                content: "收到一条来自好友的消息：",
                            },
                            ...message.elements,
                            {
                                type: "text",
                                content: "（此消息两秒后自动撤回）\n示例图片：",
                            },
                            // 附带一个插件目录下的 example.jpg 作为图片发送
                            {
                                type: "image",
                                file: path.join(__dirname, "example.jpg"),
                            },
                        ])
                        .then((id) => {
                            setTimeout(() => {
                                qqntim.nt.revokeMessage(message.peer, id);
                            }, 2000);
                        });
                });
            });
        });
        //#endregion
    }
};
