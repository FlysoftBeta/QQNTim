export type IPCArgs = [{ type: string; eventName: string; callbackId: string }, any[]];
export type InterruptIPC = (args: IPCArgs) => boolean | undefined;
export type InterruptWindowCreation = (
    args: Electron.BrowserWindowConstructorOptions
) => Electron.BrowserWindowConstructorOptions;
