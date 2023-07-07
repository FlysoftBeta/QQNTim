import "./electron";
import TypedEmitter from "typed-emitter";

declare namespace QQNTim {
    namespace IPC {
        type Direction = "in" | "out";
        type Response = { errMsg: string; result: number };
        type Request = any[];
        type Args<T> = [{ type: string; eventName: string; callbackId: string }, T];
        interface InterruptIPCOptions {
            type?: "request" | "response";
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
            onWindowLoaded(): void;
        }
    }

    namespace API {
        namespace Main {
            interface API {
                version: string;
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
                browserwindow: BrowserWindowAPI;
                modules: {
                    fs: typeof import("fs-extra");
                };
                utils: {
                    waitForElement<T extends Element>(selector: string): Promise<T>;
                    ntCall(eventName: string, cmd: string, args: any[]): Promise<IPC.Response>;
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
                interface Friend {
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
                    "friends-list-updated": (list: Friend[]) => void;
                    "groups-list-updated": (list: Group[]) => void;
                };
                type EventEmitter = TypedEmitter<Events>;
                interface NT extends EventEmitter {
                    getAccountInfo(): Promise<LoginAccount>;
                    revokeMessage(peer: Peer, message: string): Promise<void>;
                    sendMessage(peer: Peer, elements: MessageElement[]): Promise<string>;
                    getFriendsList(forced: boolean): Promise<Friend[]>;
                    getGroupsList(forced: boolean): Promise<Group[]>;
                    getPreviousMessages(peer: Peer, count?: number, startMsgId?: string): Promise<Message[]>;
                }
            }

            interface BrowserWindowAPI {
                setSize(width: number, height: number): void;
                setMinimumSize(width: number, height: number): void;
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
