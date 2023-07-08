import { env } from "./config";
import { printObject } from "./console";

export type IPCDirection = "in" | "out";
export type IPCResponse = { errMsg: string; result: number };
export type IPCRequest = any[];
export type IPCArgs<T> = [{ type: string; eventName: string; callbackId: string }, T];
export interface InterruptIPCOptions {
    type?: "request" | "response";
    eventName?: string;
    cmdName?: string;
    direction?: IPCDirection | undefined;
}
export type InterruptIPC = (
    args: IPCArgs<any>,
    channel: string,
    sender?: Electron.WebContents
) => boolean | void;
export type InterruptWindowCreation = (
    args: Electron.BrowserWindowConstructorOptions
) => Electron.BrowserWindowConstructorOptions;

const interruptIpcs: [InterruptIPC, InterruptIPCOptions | undefined][] = [];

function wrapIpc(args: IPCArgs<any>, direction: IPCDirection) {
    if (direction == "out" && (!args[0] || !args[0]?.eventName))
        return [{ eventName: "QQNTIM_WRAPPER", type: "request" }, args];
    else if (direction == "in" && args[0]?.eventName == "QQNTIM_WRAPPER") return args[1];
    return args;
}

function interruptIpc(
    args: IPCArgs<any>,
    direction: IPCDirection,
    channel: string,
    sender?: Electron.WebContents
) {
    for (const [func, options] of interruptIpcs) {
        if (
            options?.cmdName &&
            (!args[1] ||
                (args[1][0]?.cmdName != options?.cmdName &&
                    args[1][0] != options?.cmdName))
        )
            continue;
        if (options?.eventName && (!args[0] || args[0].eventName != options?.eventName))
            continue;
        if (options?.type && (!args[0] || args[0].type != options?.type)) continue;
        if (options?.direction && options?.direction != direction) continue;

        const ret = func(args, channel, sender);
        if (ret == false) return false;
    }

    return true;
}

export function handleIpc(
    args: IPCArgs<any>,
    direction: IPCDirection,
    channel: string,
    sender?: Electron.WebContents
) {
    if (args[0]?.eventName?.startsWith("ns-LoggerApi-")) return false;
    wrapIpc(args, direction);
    return interruptIpc(args, direction, channel, sender);
}

export function addInterruptIpc(func: InterruptIPC, options?: InterruptIPCOptions) {
    interruptIpcs.push([func, options]);
}

if (env.verboseLogging) {
    (["in", "out"] as IPCDirection[]).forEach((type) => {
        addInterruptIpc(
            (args, channel, sender) =>
                console.debug(
                    `[!Watch:IPC?${type == "in" ? "In" : "Out"}${
                        sender ? `:${sender.id.toString()}` : ""
                    }] ${channel}`,
                    printObject(args)
                ),
            { direction: type }
        );
    });
}
