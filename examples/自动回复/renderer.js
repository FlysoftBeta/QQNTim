module.exports = (qqntim) => {
    qqntim.nt.on("new-messages", (messages) => {
        console.log("[Example-AutoReply] 收到新消息", messages);
        messages.forEach((message) => {
            if (message.chatType != "friend") return;
            message.allDownloadedPromise.then(() => {
                qqntim.nt.sendMessage("friend", message.peer.uid, [
                    {
                        type: "text",
                        content: "收到一条来自好友的消息：",
                    },
                    ...message.elements,
                ]);
            });
        });
    });
};
