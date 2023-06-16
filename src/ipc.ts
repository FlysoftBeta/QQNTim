export type IPCResponse = { errMsg: string; result: number };
export type IPCRequest = any[];
export type IPCArgs<T> = [{ type: string; eventName: string; callbackId: string }, T];
export interface InterruptIPCOptions {
    type?: "request" | "response";
    eventName?: string;
    cmdName?: string;
}
export type InterruptIPC = (args: IPCArgs<any>) => boolean | void;
export type InterruptWindowCreation = (
    args: Electron.BrowserWindowConstructorOptions
) => Electron.BrowserWindowConstructorOptions;

const interruptIpcs: [InterruptIPC, InterruptIPCOptions | undefined][] = [];

export function handleIpc(args: IPCArgs<any>) {
    for (const [func, options] of interruptIpcs) {
        if (
            (options?.cmdName && args[1] && args[1][0]?.cmdName != options?.cmdName) ||
            (options?.eventName && args[0] && args[0].eventName != options?.eventName) ||
            (options?.type && args[0] && args[0].type != options?.type)
        )
            continue;

        const ret = func(args);
        if (ret == false) return;
    }
}

export function addInterruptIpc(func: InterruptIPC, options?: InterruptIPCOptions) {
    interruptIpcs.push([func, options]);
}