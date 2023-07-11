import "./electron";
import TypedEmitter from "typed-emitter";

declare namespace QQNTim {
    namespace IPC {
        type Direction = "in" | "out";
        type Type = "request" | "response";
        type Response = { errMsg: string; result: number };
        type Request = any[];
        type Args<T> = [{ type: string; eventName: string; callbackId: string }, T];
        interface InterruptIPCOptions {
            type?: Type;
            eventName?: string;
            cmdName?: string;
            direction?: Direction | undefined;
        }
        type InterruptFunction = (args: Args<any>, channel: string, sender?: Electron.WebContents) => boolean | void;
    }

    namespace WindowCreation {
        type InterruptArgsFunction = (args: Electron.BrowserWindowConstructorOptions) => Electron.BrowserWindowConstructorOptions;
        type InterruptFunction = (window: Electron.BrowserWindow) => void;
    }

    namespace Configuration {
        type Configuration = {
            plugins?: {
                /**
                 * 插件白名单
                 * 置为 `undefined` 时禁用白名单
                 */
                whitelist?: string[];
                /**
                 * 插件黑名单
                 * 置为 `undefined` 时禁用黑名单
                 */
                blacklist?: string[];
            };
            /**
             * 显示详细日志输出
             * @description 开启后，可以在控制台内查看到 IPC 通信、部分 Electron 对象的成员访问信息等。
             */
            verboseLogging?: boolean;
            /**
             * 使用原版 DevTools
             * @description 使用 Chromium DevTools 而不是 chii DevTools (Windows 版 9.8.5 及以上不可用)。
             */
            useNativeDevTools?: boolean;
            /**
             * 禁用兼容性处理
             * @description 禁用后，LiteLoader 和 BetterQQNT 可能将不能与 QQNTim 一起使用。
             */
            disableCompatibilityProcessing?: boolean;
        };

        interface Environment {
            /**
             * 当前使用的配置
             */
            config: Required<Configuration>;
            path: {
                /**
                 * 数据目录
                 */
                dataDir: string;
                /**
                 * 配置文件
                 */
                configFile: string;
                /**
                 * 插件目录
                 */
                pluginDir: string;
                /**
                 * 给每个 QQ 号单独的插件目录
                 */
                pluginPerUserDir: string;
            };
        }
    }

    namespace Entry {
        class Main {
            /**
             * 当插件加载时触发
             * @param qqntim QQNTim API
             */
            constructor(qqntim: API.Main.API);
        }
        class Renderer {
            /**
             * 当插件加载时触发
             * @param qqntim QQNTim API
             */
            constructor(qqntim: API.Renderer.API);
            onWindowLoaded?(): void;
        }
    }

    namespace Plugin {
        interface InjectionMain {
            type: "main";
            script: string | undefined;
        }
        interface InjectionRenderer {
            type: "renderer";
            page: Manifest.Page[] | undefined;
            pattern: RegExp | undefined;
            stylesheet: string | undefined;
            script: string | undefined;
        }
        type Injection = InjectionMain | InjectionRenderer;
        interface Plugin {
            /**
             * 是否已被加载
             */
            loaded: boolean;
            /**
             * 是否满足插件加载条件
             */
            meetRequirements: boolean;
            /**
             * 是否已被启用
             */
            enabled: boolean;
            /**
             * 唯一 ID
             */
            id: string;
            /**
             * 插件文件所在的目录
             */
            dir: string;
            /**
             * 脚本和样式注入
             */
            injections: Injection[];
            /**
             * 插件清单内容
             */
            manifest: Manifest.Manifest;
        }
        type AllUsersPlugins = Record<string, UserPlugins>;
        type UserPlugins = Record<string, Plugin>;
        type LoadedPlugins = Record<string, Plugin>;
    }

    namespace API {
        namespace Main {
            interface API {
                /**
                 * 环境信息
                 */
                env: Configuration.Environment;
                /**
                 * QQNTim 版本号
                 */
                version: string;
                /**
                 * QQ 版本号
                 */
                ntVersion: string;
                interrupt: {
                    /**
                     * 拦截 IPC 通讯
                     * @param func 处理函数
                     * @param options 过滤选项
                     * @returns
                     */
                    ipc: (func: IPC.InterruptFunction, options: IPC.InterruptIPCOptions) => void;
                    /**
                     * 拦截窗口创建并修改 `BrowserWindow` 参数 (在窗口创建前)
                     * @param func 处理函数
                     * @returns
                     */
                    windowArgs: (func: WindowCreation.InterruptArgsFunction) => void;
                    /**
                     * 拦截 `BrowserWindow` 创建 (在窗口创建后)
                     * @param func 处理函数
                     * @returns
                     */
                    windowCreation: (func: WindowCreation.InterruptFunction) => void;
                };
                modules: {
                    fs: typeof import("fs-extra");
                };
            }
        }
        namespace Renderer {
            interface API {
                allPlugins: Plugin.AllUsersPlugins;
                env: Configuration.Environment;
                version: string;
                ntVersion: string;
                interrupt: {
                    /**
                     * 拦截 IPC 通讯
                     * @param func 处理函数
                     * @param options 过滤选项
                     * @returns
                     */
                    ipc(func: IPC.InterruptFunction, options: IPC.InterruptIPCOptions): void;
                };
                nt: NT.NT;
                browserWindow: BrowserWindowAPI;
                app: AppAPI;
                dialog: DialogAPI;
                modules: {
                    fs: typeof import("fs-extra");
                };
                utils: {
                    waitForElement<T extends Element>(selector: string): Promise<T>;
                    ntCall(eventName: string, cmd: string, args: any[]): Promise<IPC.Response>;
                    ntInterrupt(callback: QQNTim.IPC.InterruptFunction, eventName: string, cmdName: string, direction?: QQNTim.IPC.Direction, type?: QQNTim.IPC.Type): void;
                    getVueId(element: HTMLElement): string | undefined;
                };
                windowLoadPromise: WindowLoadPromise;
            }
            type WindowLoadPromise = Promise<void>;
            namespace NT {
                interface MessageElementBase {
                    raw: object;
                }
                interface MessageElementText extends MessageElementBase {
                    type: "text";
                    content: string;
                }
                interface MessageElementImage extends MessageElementBase {
                    type: "image";
                    file: string;
                    downloadedPromise: Promise<void>;
                }
                interface MessageElementFace extends MessageElementBase {
                    type: "face";
                    faceIndex: number;
                    faceType: "normal" | "normal-extended" | "super" | number;
                    faceSuperIndex?: number;
                }
                interface MessageElementRaw extends MessageElementBase {
                    type: "raw";
                }
                type MessageElement = MessageElementText | MessageElementImage | MessageElementFace | MessageElementRaw;
                type MessageElementSend = Omit<MessageElementText, "raw"> | Omit<MessageElementImage, "raw"> | Omit<Omit<MessageElementFace, "raw">, "downloadPromise"> | MessageElementRaw;
                interface Message {
                    peer: Peer;
                    sender: Sender;
                    elements: MessageElement[];
                    allDownloadedPromise: Promise<void[]>;
                    raw: object;
                }
                interface Sender {
                    uid: string;
                    memberName?: string;
                    nickName?: string;
                }
                interface Peer {
                    chatType: "friend" | "group" | "others";
                    uid: string;
                    name?: string;
                }
                interface User {
                    uid: string;
                    uin: string;
                    qid: string;
                    avatarUrl: string;
                    nickName: string;
                    bio: string;
                    sex: "male" | "female" | "unset" | "others";
                    raw: object;
                }
                interface Group {
                    uid: string;
                    avatarUrl: string;
                    name: string;
                    role: "master" | "moderator" | "member" | "others";
                    maxMembers: number;
                    members: number;
                    raw: object;
                }
                interface LoginAccount {
                    uid: string;
                    uin: string;
                }

                type Events = {
                    "new-messages": (messages: Message[]) => void;
                    "friends-list-updated": (list: User[]) => void;
                    "groups-list-updated": (list: Group[]) => void;
                };
                type EventEmitter = TypedEmitter<Events>;
                interface NT extends EventEmitter {
                    getAccountInfo(): Promise<LoginAccount | undefined>;
                    revokeMessage(peer: Peer, message: string): Promise<void>;
                    sendMessage(peer: Peer, elements: MessageElement[]): Promise<string>;
                    getFriendsList(forced: boolean): Promise<User[]>;
                    getGroupsList(forced: boolean): Promise<Group[]>;
                    getPreviousMessages(peer: Peer, count?: number, startMsgId?: string): Promise<Message[]>;
                }
            }

            interface BrowserWindowAPI {
                setSize(width: number, height: number): void;
                setMinimumSize(width: number, height: number): void;
            }
            interface AppAPI {
                relaunch(): void;
                quit(): void;
                exit(): void;
            }
            interface DialogAPI {
                confirm(message?: string): Promise<boolean>;
                alert(message?: string): Promise<void>;
                messageBox(options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue>;
                openDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue>;
                saveDialog(options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue>;
            }
        }
    }

    namespace Manifest {
        /**
         * 分别表示登录页面、主界面、独立聊天窗口、设置界面和其他
         */
        type Page = "login" | "main" | "chat" | "settings" | "others";
        type PageWithAbout = Page | "about";
        /**
         * 注入主进程
         */
        interface InjectionMain {
            /**
             * 向主进程注入脚本时，此项必须置为 "main"
             */
            type: "main";
            /**
             * 注入的脚本文件 (*.js)
             */
            script?: string;
        }
        /**
         * 注入渲染进程
         */
        interface InjectionRenderer {
            /**
             * 向渲染进程注入脚本时，此项必须置为 "renderer"
             */
            type: "renderer";
            /**
             * 指定此注入生效的页面
             */
            page?: Page[];
            /**
             * 指定此注入生效的页面 (正则表达式匹配)
             */
            pattern?: string;
            /**
             * 注入的样式文件 (*.css) (相对路径)
             */
            stylesheet?: string;
            /**
             * 注入的脚本文件 (*.js) (相对路径)
             */
            script?: string;
        }
        interface RequirementsOS {
            /**
             * 支持的操作系统类型
             */
            platform: NodeJS.Platform;
            /**
             * `x` 须小于等于当前的操作系统版本
             */
            lte?: string;
            /**
             * `x` 须小于当前的操作系统版本
             */
            lt?: string;
            /**
             * `x` 须大于等于当前的操作系统版本
             */
            gte?: string;
            /**
             * `x` 须大于当前的操作系统版本
             */
            gt?: string;
            /**
             * `x` 须等于当前的操作系统版本
             */
            eq?: string;
        }
        type Injection = InjectionMain | InjectionRenderer;
        interface Requirements {
            /**
             * 加载插件的操作系统要求
             * 可以使用多个属性来指定一个版本区间。
             * @example
             * {
             *     "platform": "win32",
             *     "lte": "10.0.22621",
             *     "gte": "6.1.0"
             * }
             * // 此示例代表满足 Windows 7 <= 当前系统版本 <= Windows 11 22H2 (6.1 <= 当前系统版本 <= 10.0.22621) 时加载插件。
             */
            os?: RequirementsOS[];
        }
        /**
         * 插件规范版本
         */
        type ManifestVersion = "1.0" | "2.0";
        /**
         * @example
         * {
         *    "manifestVersion": "2.0",
         *    "id": "my-plugin",
         *    "name": "我的插件",
         *    "author": "Flysoft",
         *    "requirements": {
         *        "os": [
         *            {
         *                "platform": "win32",
         *                "lte": "10.0.22621",
         *                "gte": "6.1.0"
         *            }
         *        ]
         *    },
         *    "injections": [
         *        {
         *            "type": "main",
         *            "script": "main.js"
         *        },
         *        {
         *            "type": "renderer",
         *            "page": ["main", "chat"],
         *            "script": "main.js",
         *            "stylesheet": "style.css"
         *        }
         *    ]
         *}
         */
        interface Manifest {
            /**
             * 插件规范版本
             */
            manifestVersion: ManifestVersion;
            /**
             * 唯一 ID
             */
            id: string;
            /**
             * 显示名称
             */
            name: string;
            /**
             * 说明
             */
            description: string;
            /**
             * 作者
             */
            author: string;
            /**
             * 脚本和样式注入
             */
            injections: Injection[];
            /**
             * 加载条件
             */
            requirements?: Requirements;
        }
    }
}
