export type IPCResponse = { errMsg: string; result: number };
export type IPCRequest = any[];
export type IPCArgs<T> = [{ type: string; eventName: string; callbackId: string }, T];
export type InterruptIPC = (args: IPCArgs<any>) => boolean | void;
export type InterruptWindowCreation = (
    args: Electron.BrowserWindowConstructorOptions
) => Electron.BrowserWindowConstructorOptions;
