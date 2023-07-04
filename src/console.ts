import supportsColor from "supports-color";
import { inspect } from "util";

const termSupportsColor = !!supportsColor.stdout;

export function printObject(object: any) {
    return global.window
        ? JSON.stringify(object)
        : inspect(object, {
              compact: true,
              depth: null,
              showHidden: true,
              colors: termSupportsColor,
          });
}
