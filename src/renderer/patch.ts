import { handleIpc } from "../common/ipc";
import { defineModules, getModule } from "../common/patch";
import { getter, setter } from "../common/watch";
import { contextBridge, ipcRenderer } from "electron";
import { Module } from "module";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as ReactJSXRuntime from "react/jsx-runtime";
import { env } from "../common/global";
import { printObject } from "../common/console";
import { hasColorSupport } from "./main";

function patchIpcRenderer() {
    return new Proxy(ipcRenderer, {
        get(target, p) {
            if (p == "on")
                return (channel: string, listener: (event: any, ...args: any[]) => void) => {
                    target.on(channel, (event: any, ...args: QQNTim.IPC.Args<any>) => {
                        if (handleIpc(args, "in", channel)) listener(event, ...args);
                    });
                };
            else if (p == "send")
                return (channel: string, ...args: QQNTim.IPC.Args<any>) => {
                    if (handleIpc(args, "out", channel)) target.send(channel, ...args);
                };
            else if (p == "sendSync")
                return (channel: string, ...args: QQNTim.IPC.Args<any>) => {
                    if (handleIpc(args, "out", channel)) return target.sendSync(channel, ...args);
                };
            return getter(undefined, target, p as any);
        },
        set(target, p, newValue) {
            return setter(undefined, target, p as any, newValue);
        },
    });
}

function patchContextBridge() {
    return new Proxy(contextBridge, {
        get(target, p) {
            if (p == "exposeInMainWorld")
                return (apiKey: string, api: any) => {
                    window[apiKey] = api;
                };
            return getter(undefined, target, p as any);
        },
        set(target, p, newValue) {
            return setter(undefined, target, p as any, newValue);
        },
    });
}

export function patchModuleLoader() {
    const patchedElectron: typeof Electron.CrossProcessExports = {
        ...require("electron"),
        ipcRenderer: patchIpcRenderer(),
        contextBridge: patchContextBridge(),
    };

    defineModules({ electron: patchedElectron, react: React, "react/jsx-runtime": ReactJSXRuntime, "react-dom": ReactDOM, "react-dom/client": ReactDOMClient });

    const loadBackend = (Module as any)._load;
    (Module as any)._load = (request: string, parent: NodeModule, isMain: boolean) => {
        // 重写模块加载以隐藏 `vm` 模块弃用提示
        if (request == "vm") request = "node:vm";
        return getModule(request) || loadBackend(request, parent, isMain);
    };
}

export function patchLogger() {
    if (env.config.useNativeDevTools) return;
    const log = (level: number, ...args: any[]) => {
        const serializedArgs: any[] = [];
        for (const arg of args) {
            serializedArgs.push(typeof arg == "string" ? arg : printObject(arg, hasColorSupport));
        }
        ipcRenderer.send("___!log", level, ...serializedArgs);
    };
    (
        [
            ["debug", 0],
            ["log", 1],
            ["info", 2],
            ["warn", 3],
            ["error", 4],
        ] as [string, number][]
    ).forEach(([method, level]) => {
        console[method] = (...args: any[]) => log(level, ...args);
    });
}
