import { installFolderPluginsForAccount, installZipPluginsForAccount, uninstallPlugin } from "./installer";
import { Tab } from "./nav";
import { cl } from "./utils/consts";
import { enablePlugin, getPluginDescription, isInBlacklist, isInWhitelist, isPluginsExistent } from "./utils/utils";
import { shell } from "electron";
import { allPlugins, app, env, modules, utils } from "qqntim/renderer";
import { Fragment, ReactNode, useEffect, useState } from "react";
const { fs } = modules;

export function Panel({ currentTab, account }: { currentTab: Tab; account: QQNTim.API.Renderer.NT.LoginAccount }) {
    const [config, setConfig] = useState<Required<QQNTim.Configuration>>(env.config);
    const [savedTitle, setSavedTitle] = useState<string>();

    const saveConfigAndRestart = () => {
        fs.writeJSONSync(env.path.configFile, config);
        app.relaunch();
    };

    const resetConfigAndRestart = () => {
        fs.writeJSONSync(env.path.configFile, {});
        app.relaunch();
    };

    useEffect(() => {
        document.body.classList.toggle(cl.panel.open.c, !!currentTab.type);
        utils.waitForElement<HTMLElement>(".setting-title").then((element) => {
            if (currentTab.type) {
                setSavedTitle(element.innerText);
                element.innerText = currentTab.title;
            } else if (savedTitle) {
                element.innerText = savedTitle;
                setSavedTitle(undefined);
            }
        });
    }, [currentTab]);

    const panelProps: PanelsProps = {
        account,
        config,
        setConfig,
    };

    return (
        <>
            {currentTab.type == "settings" ? <SettingsPanel {...panelProps} /> : currentTab.type == "plugins-manager" ? <PluginsManagerPanel {...panelProps} /> : null}
            <div className={cl.panel.save.c}>
                <Button onClick={() => resetConfigAndRestart()} small={false} primary={false}>
                    重置所有设置并重启
                </Button>
                <Button onClick={() => saveConfigAndRestart()} small={false} primary={true}>
                    保存并重启
                </Button>
            </div>
        </>
    );
}

interface PanelsProps {
    account: QQNTim.API.Renderer.NT.LoginAccount;
    config: Required<QQNTim.Configuration>;
    setConfig: React.Dispatch<React.SetStateAction<Required<QQNTim.Configuration>>>;
}

function SettingsPanel({ config, setConfig }: PanelsProps) {
    return (
        <>
            <Section title="版本信息">
                <div className={cl.panel.settings.versions.c}>
                    {[
                        ["QQNTim", process.versions.qqntim],
                        ["QQNT", process.versions.qqnt],
                        ["Electron", process.versions.electron],
                        ["Node.js", process.versions.node],
                        ["Chromium", process.versions.chrome],
                        ["V8", process.versions.v8],
                    ].map(([name, version]) => (
                        <div key={name} className={cl.panel.settings.versions.item.c}>
                            <h3>{name}</h3>
                            <div>{version}</div>
                        </div>
                    ))}
                </div>
            </Section>
            <Section title="选项">
                <SettingsBox>
                    {(
                        [
                            [
                                "显示详细日志输出",
                                "开启后，可以在控制台内查看到 IPC 通信、部分 Electron 对象的成员访问信息等。",
                                config.verboseLogging,
                                (state: boolean) =>
                                    setConfig((prev) => {
                                        return { ...prev, verboseLogging: state };
                                    }),
                            ],
                            [
                                "使用原版 DevTools",
                                "使用 Chromium DevTools 而不是 chii DevTools (Windows 版 9.8.5 及以上不可用)。",
                                config.useNativeDevTools,
                                (state) =>
                                    setConfig((prev) => {
                                        return { ...prev, useNativeDevTools: state };
                                    }),
                            ],
                            [
                                "禁用兼容性处理",
                                "禁用后，LiteLoader 可能将不能与 QQNTim 一起使用。",
                                config.disableCompatibilityProcessing,
                                (state) =>
                                    setConfig((prev) => {
                                        return { ...prev, disableCompatibilityProcessing: state };
                                    }),
                            ],
                        ] as [string, string, boolean, (state: boolean) => void][]
                    ).map(([title, description, value, setValue], idx, array) => (
                        // rome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        <SettingsBoxItem key={idx} title={title} description={[description]} isLast={idx == array.length - 1}>
                            <Switch checked={value} onToggle={setValue} />
                        </SettingsBoxItem>
                    ))}
                </SettingsBox>
            </Section>
        </>
    );
}

function PluginsManagerPanel({ account, config, setConfig }: PanelsProps) {
    const [existentPlugins, setExistentPlugins] = useState<string[]>(isPluginsExistent());

    return Array.from(new Set([...Object.keys(allPlugins), account.uin]))
        .sort()
        .map((uin: string) => {
            const plugins = allPlugins[uin] || {};
            const requiresRestart = uin == account.uin || uin == "";
            const isEmpty = Object.keys(plugins).length == 0;
            if (uin != account.uin && isEmpty) return;
            return (
                <Section
                    key={uin}
                    title={uin == "" ? "对所有账号生效的插件" : `仅对账号 ${uin} 生效的插件`}
                    buttons={
                        <>
                            <Button onClick={() => installZipPluginsForAccount(uin, requiresRestart)} primary={false} small={true}>
                                安装插件压缩包 (.zip)
                            </Button>
                            <Button onClick={() => installFolderPluginsForAccount(uin, requiresRestart)} primary={false} small={true}>
                                安装插件文件夹
                            </Button>
                        </>
                    }
                >
                    <SettingsBox>
                        {!isEmpty ? (
                            Object.keys(plugins)
                                .sort()
                                .map((id, idx, array) => {
                                    const plugin = plugins[id];
                                    const inWhitelist = isInWhitelist(id, config.plugins.whitelist);
                                    const inBlacklist = isInBlacklist(id, config.plugins.blacklist);
                                    const description = getPluginDescription(plugin);

                                    if (!existentPlugins.includes(id)) return;
                                    return (
                                        <SettingsBoxItem key={id} title={plugin.manifest.name} description={description} isLast={idx == array.length - 1}>
                                            <Switch checked={!!(inWhitelist || (!inWhitelist && !inBlacklist))} onToggle={(state) => enablePlugin(setConfig, id, state, inWhitelist, inBlacklist)} />
                                            <Button onClick={() => shell.openPath(plugin.dir)} small={true} primary={false}>
                                                文件夹
                                            </Button>
                                            <Button onClick={() => uninstallPlugin(requiresRestart, plugin.dir).then((success) => success && setExistentPlugins((prev) => prev.filter((pluginId) => pluginId != id)))} small={true} primary={false}>
                                                删除
                                            </Button>
                                        </SettingsBoxItem>
                                    );
                                })
                        ) : (
                            <SettingsBoxItem title="此处还没有任何插件 :(" isLast={true} />
                        )}
                    </SettingsBox>
                </Section>
            );
        });
}

function Section({ title, children, buttons }: { title: string; children: ReactNode; buttons?: ReactNode }) {
    return (
        <div className={cl.panel.section.c}>
            <span className={cl.panel.section.header.c}>
                <h2 className={cl.panel.section.header.title.c}>{title}</h2>
                {!!buttons && <div className={cl.panel.section.header.buttons.c}>{buttons}</div>}
            </span>
            <div className={cl.panel.section.content.c}>{children}</div>
        </div>
    );
}

function SettingsBox({ children }: { children: ReactNode }) {
    return <div className={cl.panel.box.c}>{children}</div>;
}

function SettingsBoxItem({ title, description, children, isLast = false }: { title: string; description?: string[]; children?: ReactNode; isLast?: boolean }) {
    return (
        <label className={`${cl.panel.box.item.c}${isLast ? ` ${cl.panel.box.item.last.c}` : ""}`}>
            <span>
                <span className={cl.panel.box.item.title.c}>{title}</span>
                {description ? (
                    <span className={cl.panel.box.item.description.c}>
                        {description.map((text, idx, array) => {
                            return (
                                // rome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                <Fragment key={idx}>
                                    <span>{text}</span>
                                    {idx != array.length - 1 && <br />}
                                </Fragment>
                            );
                        })}
                    </span>
                ) : null}
            </span>
            <div>{children}</div>
        </label>
    );
}

function Switch({ checked, onToggle }: { checked: boolean; onToggle: (checked: boolean) => void }) {
    return (
        <div className={`q-switch${checked ? " is-active" : ""}`} onClick={() => onToggle(!checked)}>
            <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} />
            <div className="q-switch__handle" />
        </div>
    );
}

function Button({ onClick, primary, small, children }: { onClick: () => void; primary: boolean; small: boolean; children: ReactNode }) {
    return (
        <button className={`q-button q-button--default ${primary ? "q-button--primary" : "q-button--secondary"}${small ? " q-button--small" : ""}`} onClick={() => onClick()}>
            <span className="q-button__slot-warp">{children}</span>
        </button>
    );
}
