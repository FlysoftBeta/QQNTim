import { inspect } from "util";
import { verboseLogging } from "./env";

export type IPCResponse = { errMsg: string; result: number };
export type IPCRequest = any[];
export type IPCArgs<T> = [{ type: string; eventName: string; callbackId: string }, T];
export interface InterruptIPCOptions {
    type?: "request" | "response";
    eventName?: string;
    cmdName?: string;
    direction?: "in" | "out" | undefined;
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

export function handleIpc(
    args: IPCArgs<any>,
    channel: string,
    ipcIn: boolean,
    sender?: Electron.WebContents
) {
    if (!ipcIn && (!args[0] || !args[0]?.eventName)) {
        args.push(
            { eventName: "QQNTIM_WRAPPER", type: "request" },
            args.splice(0, args.length)
        );
    }
    if (ipcIn && args[0]?.eventName == "QQNTIM_WRAPPER")
        args.push(...args.splice(0, 2)[1]);

    if (args[0]?.eventName == "ns-LoggerApi-1" || args[0]?.eventName == "ns-LoggerApi-2")
        return false;

    for (const [func, options] of interruptIpcs) {
        if (
            (options?.cmdName &&
                (!args[1] ||
                    (args[1][0]?.cmdName != options?.cmdName &&
                        args[1][0] != options?.cmdName))) ||
            (options?.eventName &&
                (!args[0] || args[0].eventName != options?.eventName)) ||
            (options?.type && (!args[0] || args[0].type != options?.type)) ||
            (options?.direction == "in" && !ipcIn) ||
            (options?.direction == "out" && ipcIn)
        ) {
            continue;
        }

        const ret = func(args, channel, sender);
        if (ret == false) return false;
    }
    return true;
}

export function addInterruptIpc(func: InterruptIPC, options?: InterruptIPCOptions) {
    interruptIpcs.push([func, options]);
}

if (verboseLogging) {
    addInterruptIpc(
        (args, channel) =>
            console.debug(
                `[IPC] (In) ${channel}`,
                global.window
                    ? JSON.stringify(args)
                    : inspect(args, {
                          compact: true,
                          depth: null,
                          showHidden: true,
                          colors: true,
                      })
            ),
        { direction: "in" }
    );
    addInterruptIpc(
        (args, channel) =>
            console.debug(
                `[IPC] (Out) ${channel}`,
                global.window
                    ? JSON.stringify(args)
                    : inspect(args, {
                          compact: true,
                          depth: null,
                          showHidden: true,
                          colors: true,
                      })
            ),
        { direction: "out" }
    );
}
