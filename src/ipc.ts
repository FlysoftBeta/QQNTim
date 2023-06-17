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
export type InterruptIPC = (args: IPCArgs<any>) => boolean | void;
export type InterruptWindowCreation = (
    args: Electron.BrowserWindowConstructorOptions
) => Electron.BrowserWindowConstructorOptions;

const interruptIpcs: [InterruptIPC, InterruptIPCOptions | undefined][] = [];

export function handleIpc(args: IPCArgs<any>, ipcIn: boolean) {
    for (const [func, options] of interruptIpcs) {
        if (
            (options?.cmdName && (!args[1] || args[1][0]?.cmdName != options?.cmdName)) ||
            (options?.eventName &&
                (!args[0] || args[0].eventName != options?.eventName)) ||
            (options?.type && (!args[0] || args[0].type != options?.type)) ||
            (options?.direction == "in" && !ipcIn) ||
            (options?.direction == "out" && ipcIn)
        )
            continue;

        const ret = func(args);
        if (ret == false) return;
    }
}

export function addInterruptIpc(func: InterruptIPC, options?: InterruptIPCOptions) {
    interruptIpcs.push([func, options]);
}

if (verboseLogging) {
    addInterruptIpc(
        (args) =>
            console.log(
                `[IPC] (In)`,
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
        (args) =>
            console.log(
                `[IPC] (Out)`,
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
