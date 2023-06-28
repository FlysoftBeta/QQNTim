import * as path from "path";
import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import { createServer } from "http";
import { getCurrentNTResourceDir } from "../ntResourceDir";
import { getIpcPath } from "../ipcPath";

const s = path.sep;
const wrapper = require(`${getCurrentNTResourceDir()}${s}wrapper.node`);

const events = new EventEmitter();

async function requestHandler(method: string, params: any) {
    if (method == "ListFunctions") {
        return Object.keys(wrapper);
    } else if (method == "CallFunction") {
        return (wrapper[params.name] as Function)(...params.params);
    }
    return {};
}

function startServer() {
    const pipe = randomUUID();
    const ipcPath = getIpcPath(pipe);

    const server = createServer().listen(ipcPath);
    const wss = new WebSocketServer({ server: server });
    console.log(ipcPath);

    wss.on("connection", (socket) => {
        socket.on("message", (data) => {
            const { id, method, params } = JSON.parse(data.toString());
            requestHandler(method, params).then((result) =>
                socket.send(JSON.stringify({ id: id, result: result }))
            );
        });
        const listener = (event: string, params: object) =>
            socket.send(JSON.stringify({ event: event, params: params }));
        events.on("message", listener);
        socket.on("close", () => events.off("message", listener));
    });
}

startServer();
