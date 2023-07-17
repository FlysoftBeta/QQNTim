import supportsColor from "supports-color";
import { inspect } from "util";

export const hasColorSupport = !!supportsColor.stdout;

export function printObject(object: any, enableColorSupport = !window && hasColorSupport) {
    return inspect(object, {
        compact: true,
        depth: null,
        showHidden: true,
        colors: enableColorSupport,
    });
}
