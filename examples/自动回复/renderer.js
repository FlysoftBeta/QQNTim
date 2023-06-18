module.exports = (qqntim) => {
    qqntim.nt.getFriendsList().then((list) => {
        console.log("[Example-AutoReply] 好友列表", list);
        list.forEach((friend) =>
            qqntim.nt
                .getPreviousMessages({ chatType: "friend", uid: friend.uid }, 20)
                .then((messages) =>
                    console.log(
                        "[Example-AutoReply] 好友 " +
                            friend.nickName +
                            " 的最近 20 条消息",
                        messages
                    )
                )
        );
    });

    qqntim.nt.getGroupsList().then((list) => {
        console.log("[Example-AutoReply] 群组列表", list);
        list.forEach((group) =>
            qqntim.nt
                .getPreviousMessages({ chatType: "group", uid: group.uid }, 20)
                .then((messages) =>
                    console.log(
                        "[Example-AutoReply] 群组 " + group.name + " 的最近 20 条消息",
                        messages
                    )
                )
        );
    });

    qqntim.nt.on("new-messages", (messages) => {
        console.log("[Example-AutoReply] 收到新消息", messages);
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
                            content: "（此消息两秒后自动撤回）",
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
};
