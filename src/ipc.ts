import { printObject } from "./console";
import { env } from "./globalVar";
import { QQNTim } from "@flysoftbeta/qqntim-typings";

const interruptIpcs: [QQNTim.IPC.InterruptFunction, QQNTim.IPC.InterruptIPCOptions | undefined][] = [];

function interruptIpc(args: QQNTim.IPC.Args<any>, direction: QQNTim.IPC.Direction, channel: string, sender?: Electron.WebContents) {
    for (const [func, options] of interruptIpcs) {
        if (options?.cmdName && (!args[1] || (args[1][0]?.cmdName != options?.cmdName && args[1][0] != options?.cmdName))) continue;
        if (options?.eventName && (!args[0] || args[0].eventName != options?.eventName)) continue;
        if (options?.type && (!args[0] || args[0].type != options?.type)) continue;
        if (options?.direction && options?.direction != direction) continue;

        const ret = func(args, channel, sender);
        if (ret == false) return false;
    }

    return true;
}

export function handleIpc(args: QQNTim.IPC.Args<any>, direction: QQNTim.IPC.Direction, channel: string, sender?: Electron.WebContents) {
    if (args[0]?.eventName?.startsWith("ns-LoggerApi-")) return false;
    return interruptIpc(args, direction, channel, sender);
}

export function addInterruptIpc(func: QQNTim.IPC.InterruptFunction, options?: QQNTim.IPC.InterruptIPCOptions) {
    interruptIpcs.push([func, options]);
}

export function watchIpc() {
    if (env.config.verboseLogging) {
        (["in", "out"] as QQNTim.IPC.Direction[]).forEach((type) => {
            addInterruptIpc((args, channel, sender) => console.debug(`[!Watch:IPC?${type == "in" ? "In" : "Out"}${sender ? `:${sender.id.toString()}` : ""}] ${channel}`, printObject(args)), { direction: type });
        });
    }
}
