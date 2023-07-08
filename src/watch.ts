import { printObject } from "./console";
import { env } from "./config";

type Constructor<T> = new (...args: any[]) => T;

export function getter<T, R extends keyof T>(scope: string, target: T, p: R) {
    if (p == "__qqntim_original_object") return target;
    if (typeof target[p] == "function")
        return (...argArray: any[]) => {
            const res = (target[p] as Function).apply(target, argArray);
            if (env.verboseLogging)
                console.debug(
                    `[!Watch:${scope}] 调用：${p as string}`,
                    printObject(argArray),
                    res != target ? printObject(res) : "[已隐藏]"
                );
            return res;
        };
    else {
        const res = target[p];
        if (env.verboseLogging) console.debug(`[!Watch:${scope}] 获取：${p as string}`);
        return res;
    }
}

export function setter<T, R extends keyof T>(
    scope: string,
    target: T,
    p: R,
    newValue: T[R]
) {
    if (env.verboseLogging)
        console.debug(`[!Watch:${scope}] 设置：${p as string}`, printObject(newValue));
    return true;
}

export function construct<F, T extends Constructor<F>>(
    scope: string,
    target: T,
    argArray: any[]
) {
    if (env.verboseLogging)
        console.debug(`[!Watch:${scope}] 构造新实例：`, printObject(argArray));
    return new target(...argArray);
}

export function apply<T extends Function>(target: T, thisArg: any, argArray: any[]) {
    return target.apply(thisArg, argArray);
}
