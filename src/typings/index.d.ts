/// <reference types="node" />
/// <reference types="react" />
/// <reference types="./electron" />

declare module "qqntim/main" {
    export = QQNTim.API.Main;
}

declare module "qqntim/renderer" {
    export = QQNTim.API.Renderer;
}

declare module "qqntim-settings" {
    export = QQNTim.Settings;
}

declare module "qqntim-settings/components" {
    export = QQNTim.SettingsComponents;
}

declare namespace QQNTim {
    namespace IPC {
        type Direction = "in" | "out";
        type Type = "request" | "response";
        type Response = { errMsg: string; result: number };
        type Request = any[];
        type Args<T> = [{ type: string; eventName: string; callbackId: string }, T];
        interface InterruptIPCOptions {
            /**
             * 类型 (`request` 或 `response`)
             */
            type?: Type;
            /**
             * 事件名称 (如 `ns-ntApi` 或 `ns-fsApi` 等)
             */
            eventName?: string;
            /**
             * 命令名称
             */
            cmdName?: string;
            /**
             * 方向 (接收或发送)
             */
            direction?: Direction | undefined;
        }
        type InterruptFunction = (args: Args<any>, channel: string, sender?: Electron.WebContents) => boolean | void;
    }

    namespace WindowCreation {
        type InterruptArgsFunction = (args: Electron.BrowserWindowConstructorOptions) => Electron.BrowserWindowConstructorOptions;
        type InterruptFunction = (window: Electron.BrowserWindow) => void;
    }

    interface Configuration {
        plugins?: {
            /**
             * 插件白名单
             */
            whitelist?: string[];
            /**
             * 插件黑名单
             */
            blacklist?: string[];
            /**
             * 插件配置
             */
            config?: Record<string, object>;
        };
        /**
         * 自定义插件加载器路径
         */
        pluginLoaders: string[];
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
    }

    interface Environment {
        config: Required<Configuration>;
        path: {
            /**
             * 数据目录
             */
            dataDir: string;
            /**
             * 配置文件 (`qqntim.json`)
             */
            configFile: string;
            /**
             * 插件目录 (`plugins`)
             */
            pluginDir: string;
            /**
             * 用户插件目录 (`plugins-user`)
             */
            pluginPerUserDir: string;
        };
    }

    namespace Entry {
        class Main {
            /**
             * 当插件加载时触发
             */
            constructor();
        }
        class Renderer {
            /**
             * 当插件加载时触发
             */
            constructor();
            /**
             * 当页面加载完毕时触发
             */
            onWindowLoaded?(): void;
        }
    }

    interface Plugin {
        /**
         * 是否已经加载
         */
        loaded: boolean;
        /**
         * 当前环境是否满足条件
         */
        meetRequirements: boolean;
        /**
         * 是否启用
         */
        enabled: boolean;
        /**
         * 唯一 ID
         */
        id: string;
        /**
         * 插件所在目录
         */
        dir: string;
        /**
         * 脚本和样式注入
         */
        injections: Plugin.Injection[];
        /**
         * 插件清单
         */
        manifest: Manifest;
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
        type AllUsersPlugins = Record<string, UserPlugins>;
        type UserPlugins = Record<string, Plugin>;
        type LoadedPlugins = Record<string, Plugin>;
    }

    namespace API {
        type DefineModulesFunction = (newModules: Record<string, any>) => void;
        namespace Main {
            /**
             * 所有已经扫描到的插件列表
             */
            const allPlugins: Plugin.AllUsersPlugins;
            /**
             * 当前的配置数据和配置文件路径
             */
            const env: Environment;
            const interrupt: {
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
            /**
             * 定义新模块
             * @description 定义后，其他插件可通过 require 引入。
             */
            const defineModules: DefineModulesFunction;
            const modules: {
                fs: typeof import("fs-extra");
            };
        }
        namespace Renderer {
            /**
             * 所有已经扫描到的插件列表
             */
            const allPlugins: Plugin.AllUsersPlugins;
            /**
             * 当前的配置数据和配置文件路径
             */
            const env: Environment;
            const interrupt: {
                /**
                 * 拦截 IPC 通讯
                 * @param func 处理函数
                 * @param options 过滤选项
                 * @returns
                 */
                ipc(func: IPC.InterruptFunction, options: IPC.InterruptIPCOptions): void;
            };
            /**
             * NT API
             */
            const nt: NT;
            /**
             * 窗口 API
             */
            const browserWindow: BrowserWindowAPI;
            /**
             * 应用程序生命周期 API
             */
            const app: AppAPI;
            /**
             * 对话框 API
             */
            const dialog: DialogAPI;
            const modules: {
                fs: typeof import("fs-extra");
            };
            /**
             * 定义新模块
             * @description 定义后，其他插件可通过 require 引入。
             */
            const defineModules: DefineModulesFunction;
            const utils: {
                /**
                 * 等待 DOM 元素出现
                 * @description 当元素出现时，此函数返回的 Promise 会 resolve 一个元素。
                 * @param selector CSS 选择器
                 */
                waitForElement<T extends Element>(selector: string): Promise<T>;
                /**
                 * 调用 NT API
                 * @param eventName 事件名称 (如 `ns-ntApi` 或 `ns-fsApi` 等)
                 * @param cmd 命令名称
                 * @param args 参数
                 */
                ntCall(eventName: string, cmd: string, args: any[]): Promise<IPC.Response>;
                /**
                 * 拦截 NT API 调用
                 * @param callback 回调函数
                 * @param eventName 事件名称 (如 `ns-ntApi` 或 `ns-fsApi` 等)
                 * @param cmdName 命令名称
                 * @param direction 方向 (接收或发送)
                 * @param type 类型 (`request` 或 `response`)
                 */
                ntInterrupt(callback: QQNTim.IPC.InterruptFunction, eventName: string, cmdName: string, direction?: QQNTim.IPC.Direction, type?: QQNTim.IPC.Type): void;
                /**
                 * 获取与 DOM 元素相关联的 Vue 组件 ID
                 * @param element 元素
                 * @example
                 * ```html
                 * <div class="xxxxx" data-vxxxxxx>xxxxx</div>
                 * ```
                 * 将会返回 `data-vxxxxxx`。
                 */
                getVueId(element: HTMLElement): string | undefined;
            };
            /**
             * @description 当页面加载完毕时，此 Promise 会 resolve。
             */
            const windowLoadPromise: WindowLoadPromise;

            type WindowLoadPromise = Promise<void>;

            namespace NT {
                interface MessageElementBase {
                    /**
                     * QQNT 原始数据
                     */
                    raw: object;
                }
                interface MessageElementText extends MessageElementBase {
                    type: "text";
                    /**
                     * 文字数据
                     */
                    content: string;
                }
                interface MessageElementImage extends MessageElementBase {
                    type: "image";
                    /**
                     * 图片文件路径
                     */
                    file: string;
                    /**
                     * @description 当此图片文件下载完成时此 Promise 会 resolve。
                     */
                    downloadedPromise: Promise<void>;
                }
                interface MessageElementFace extends MessageElementBase {
                    type: "face";
                    /**
                     * 表情 ID
                     */
                    faceIndex: number;
                    /**
                     * 表情类型
                     * @description 分别为普通表情、扩展表情、超级表情。当此属性为一个数字时代表此类型未知。
                     */
                    faceType: "normal" | "normal-extended" | "super" | number;
                    /**
                     * 超级表情 ID
                     */
                    faceSuperIndex?: number;
                }
                interface MessageElementRaw extends MessageElementBase {
                    type: "raw";
                }
                type MessageElement = MessageElementText | MessageElementImage | MessageElementFace | MessageElementRaw;
                type MessageElementSend = Omit<MessageElementText, "raw"> | Omit<MessageElementImage, "raw"> | Omit<Omit<MessageElementFace, "raw">, "downloadPromise"> | MessageElementRaw;
                interface Message {
                    /**
                     * 聊天会话
                     */
                    peer: Peer;
                    /**
                     * 消息发送者
                     */
                    sender: Sender;
                    /**
                     * 消息元素
                     */
                    elements: MessageElement[];
                    /**
                     * @description 当消息内所有媒体文件下载完成时此 Promise 会 resolve。
                     */
                    allDownloadedPromise: Promise<void[]>;
                    /**
                     * QQNT 原始数据
                     */
                    raw: object;
                }
                interface Sender {
                    /**
                     * 发送者用户 UID
                     */
                    uid: string;
                    /**
                     * 发送者群昵称
                     * 只有在群聊中，此属性才不为空。
                     */
                    memberName?: string;
                    /**
                     * 发送者昵称
                     */
                    nickName?: string;
                }
                interface Peer {
                    /**
                     * 聊天会话类型
                     */
                    chatType: "friend" | "group" | "others";
                    /**
                     * 对象用户 ID
                     */
                    uid: string;
                    /**
                     * 聊天会话名称
                     * 主动提供此对象时，不需要设置此属性。
                     */
                    name?: string;
                }
                interface User {
                    /**
                     * 用户 ID
                     */
                    uid: string;
                    /**
                     * QQ 号
                     */
                    uin: string;
                    /**
                     * QID
                     */
                    qid: string;
                    /**
                     * 群头像 URL
                     */
                    avatarUrl: string;
                    /**
                     * 昵称
                     */
                    nickName: string;
                    /**
                     * 个性签名
                     */
                    bio: string;
                    /**
                     * 性别
                     */
                    sex: "male" | "female" | "unset" | "others";
                    /**
                     * QQNT 原始数据
                     */
                    raw: object;
                }
                interface Group {
                    /**
                     * 用户 ID
                     */
                    uid: string;
                    /**
                     * 群头像 URL
                     */
                    avatarUrl: string;
                    /**
                     * 群名称
                     */
                    name: string;
                    /**
                     * 身份组
                     */
                    role: "master" | "moderator" | "member" | "others";
                    /**
                     * 成员数量上限
                     */
                    maxMembers: number;
                    /**
                     * 成员数量
                     */
                    members: number;
                    /**
                     * QQNT 原始数据
                     */
                    raw: object;
                }
                interface LoginAccount {
                    /**
                     * 用户 ID
                     */
                    uid: string;
                    /**
                     * QQ 号
                     */
                    uin: string;
                }

                type Events = {
                    /**
                     * 当收到新消息时触发
                     * @param messages 新消息
                     * @returns
                     */
                    "new-messages": (messages: Message[]) => void;
                    /**
                     * 当好友列表更新时触发
                     * @param list 用户列表
                     * @returns
                     */
                    "friends-list-updated": (list: User[]) => void;
                    /**
                     * 当群列表更新时触发
                     * @param list 群列表
                     * @returns
                     */
                    "groups-list-updated": (list: Group[]) => void;
                };
                type EventEmitter = import("typed-emitter").default<Events>;
            }
            interface NT extends NT.EventEmitter {
                /**
                 * 获取当前登录的账号
                 * @returns 当前登录的账号
                 */
                getAccountInfo(): Promise<NT.LoginAccount | undefined>;
                /**
                 * 获取用户信息
                 * @param uid 用户 ID
                 * @returns 用户信息
                 */
                getUserInfo(uid: string): Promise<NT.User>;
                /**
                 * 撤回一条消息
                 * @param peer 聊天会话
                 * @param message 消息 ID
                 * @returns
                 */
                revokeMessage(peer: NT.Peer, message: string): Promise<void>;
                /**
                 * 发送一条消息
                 * @param peer 聊天会话
                 * @param elements 消息元素
                 * @returns 消息 ID
                 */
                sendMessage(peer: NT.Peer, elements: NT.MessageElement[]): Promise<string>;
                /**
                 * 获取好友列表
                 * @param forced 忽略缓存强制获取
                 * @returns 用户信息列表
                 */
                getFriendsList(forced: boolean): Promise<NT.User[]>;
                /**
                 * 获取群列表
                 * @param forced 忽略缓存强制获取
                 * @returns 群列表
                 */
                getGroupsList(forced: boolean): Promise<NT.Group[]>;
                /**
                 * 获取历史聊天记录
                 * @param peer 聊天会话
                 * @param count 消息数量
                 * @param startMsgId 开始位置 (消息 ID)
                 * @returns 历史消息列表
                 */
                getPreviousMessages(peer: NT.Peer, count?: number, startMsgId?: string): Promise<NT.Message[]>;
            }

            interface BrowserWindowAPI {
                setSize(width: number, height: number): void;
                setMinimumSize(width: number, height: number): void;
            }
            interface AppAPI {
                /**
                 * 重启
                 */
                relaunch(): void;
                /**
                 * 退出
                 */
                quit(): void;
                /**
                 * 强行退出
                 */
                exit(): void;
            }
            interface DialogAPI {
                /**
                 * 显示一个询问对话框，等待用户选择 "确定" 或 "取消" 按钮
                 * @param message 消息
                 * @returns 用户是否点击了 "确定" 按钮
                 */
                confirm(message?: string): Promise<boolean>;
                /**
                 * 显示一则消息
                 * @param message 消息
                 * @returns
                 */
                alert(message?: string): Promise<void>;
                /**
                 * 显示消息框
                 * @param options
                 * @returns
                 */
                messageBox(options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue>;
                /**
                 * 显示打开文件对话框
                 * @param options
                 * @returns
                 */
                openDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue>;
                /**
                 * 显示保存文件对话框
                 * @param options
                 * @returns
                 */
                saveDialog(options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue>;
            }
        }
    }

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
        manifestVersion: Manifest.ManifestVersion;
        /**
         * 唯一 ID
         */
        id: string;
        /**
         * 显示名称
         */
        name: string;
        /**
         * 插件自身版本
         */
        version?: string;
        /**
         * 说明
         */
        description?: string;
        /**
         * 作者
         */
        author?: string;
        /**
         * 脚本和样式注入
         */
        injections: Manifest.Injection[];
        /**
         * 加载条件
         */
        requirements?: Manifest.Requirements;
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
            platform: "win32" | "linux" | "darwin";
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
        type ManifestVersion = "1.0" | "2.0" | "3.0";
    }

    namespace Settings {
        type Panel = (props: PanelProps) => React.JSX.Element;

        interface PanelProps {
            config: Record<string, object>;
            setConfig: React.Dispatch<React.SetStateAction<Record<string, object>>>;
        }

        const defineSettingsPanels: (...newSettingsPanels: [string, Panel, string | undefined][]) => void;
    }
    namespace SettingsComponents {
        const SettingsSection: (props: { title: string; children: React.ReactNode; buttons?: React.ReactNode }) => React.JSX.Element;
        const SettingsBox: (props: {
            children: React.ReactNode;
        }) => React.JSX.Element;
        const SettingsBoxItem: (props: { title: string; description?: string[]; children?: React.ReactNode; isLast?: boolean }) => React.JSX.Element;
        const Switch: (props: { checked: boolean; onToggle: (checked: boolean) => void }) => React.JSX.Element;
        const Input: (props: { value: string; onChange: (value: string) => void }) => React.JSX.Element;
        const Dropdown: <T>(props: { items: [T, string][]; selected: T; onChange: (id: T) => void; width: string }) => React.JSX.Element;
        const Button: (props: { onClick: () => void; primary: boolean; small: boolean; children: React.ReactNode }) => React.JSX.Element;
    }
}

declare namespace NodeJS {
    interface ProcessVersions {
        readonly qqntim: string;
        readonly qqnt: string;
    }
}
