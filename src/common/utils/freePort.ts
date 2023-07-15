import { AddressInfo, createServer } from "net";

export function findFreePort() {
    const server = createServer().listen(0);
    const { port } = server.address()! as AddressInfo;
    server.close();
    return port;
}
