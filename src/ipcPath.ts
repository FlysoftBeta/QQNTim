export function getIpcPath(pipe: string) {
    return process.platform === "win32"
        ? "\\\\.\\pipe\\" + pipe
        : "/tmp/" + pipe + ".sock";
}
