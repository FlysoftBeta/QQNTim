import { Button, SettingsBox, SettingsBoxItem, SettingsSection, Switch } from "./exports/components";
import { installFolderPluginsForAccount, installZipPluginsForAccount, uninstallPlugin } from "./installer";
import { TabWithOtherTab } from "./nav";
import { cl } from "./utils/consts";
import { enablePlugin, getPluginDescription, isInBlacklist, isInWhitelist, isPluginsExistent } from "./utils/utils";
import { shell } from "electron";
import { allPlugins, app, env, modules, utils } from "qqntim/renderer";
import { useEffect, useState } from "react";
import { usePrevious } from "./utils/hooks";
const { fs } = modules;

interface PanelProps {
    account: QQNTim.API.Renderer.NT.LoginAccount;
    config: Required<QQNTim.Configuration>;
    setConfig: React.Dispatch<React.SetStateAction<Required<QQNTim.Configuration>>>;
}

export function Panel({ currentTab, account }: { currentTab: TabWithOtherTab; account: QQNTim.API.Renderer.NT.LoginAccount }) {
    const [config, setConfig] = useState<Required<QQNTim.Configuration>>(env.config);
    const [pluginsConfig, setPluginsConfig] = useState<Record<string, object>>(config.plugins.config || {});

    const saveConfigAndRestart = () => {
        fs.writeJSONSync(env.path.configFile, config);
        app.relaunch();
    };

    const resetConfigAndRestart = () => {
        fs.writeJSONSync(env.path.configFile, {});
        app.relaunch();
    };

    useEffect(
        () =>
            setConfig((prev) => {
                return { ...prev, plugins: { ...prev.plugins, config: pluginsConfig } };
            }),
        [pluginsConfig],
    );

    useEffect(() => {
        document.body.classList.toggle(cl.panel.open.c, !!currentTab.type);
        utils.waitForElement<HTMLElement>(".setting-title").then((element) => {
            if (element.__VUE__?.[0]?.props?.title && currentTab.title) element.__VUE__[0].props.title = currentTab.title;
        });
    }, [currentTab]);

    const panelProps: PanelProps = {
        account,
        config,
        setConfig,
    };

    return (
        <>
            {currentTab.type == "settings" ? <SettingsPanel {...panelProps} /> : currentTab.type == "plugins-manager" ? <PluginsManagerPanel {...panelProps} /> : currentTab.type == "plugin" ? <currentTab.node config={pluginsConfig} setConfig={setPluginsConfig} /> : null}
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

function SettingsPanel({ config, setConfig }: PanelProps) {
    return (
        <>
            <SettingsSection title="版本信息">
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
            </SettingsSection>
            <SettingsSection title="选项">
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
            </SettingsSection>
        </>
    );
}

function PluginsManagerPanel({ account, config, setConfig }: PanelProps) {
    const [existentPlugins, setExistentPlugins] = useState<string[]>(isPluginsExistent());

    return Array.from(new Set([...Object.keys(allPlugins), account.uin]))
        .sort()
        .map((uin: string) => {
            const plugins = allPlugins[uin] || {};
            const requiresRestart = uin == account.uin || uin == "";
            const isEmpty = Object.keys(plugins).length == 0;
            if (uin != account.uin && isEmpty) return;
            return (
                <SettingsSection
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
                </SettingsSection>
            );
        });
}
