import { version } from "../../package.json";
import { getCurrentNTVersion } from "./utils/ntVersion";

export function mountVersion() {
    const ntVersion = getCurrentNTVersion();
    Object.defineProperties(process.versions, {
        qqnt: { value: ntVersion, writable: false },
        qqntim: { value: version, writable: false },
    });
}
