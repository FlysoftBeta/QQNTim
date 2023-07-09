import { cl } from "../consts";
import { Tab } from "./nav";
import type { QQNTim } from "@flysoftbeta/qqntim-typings";
import type { ReactNode } from "react";
const React = window.React;
const { useEffect, useState } = React;

export function Panel({ qqntim, currentTab }: { qqntim: QQNTim.API.Renderer.API; currentTab: Tab }) {
    const fs = qqntim.modules.fs;

    const [config, setConfig] = useState<Required<QQNTim.Configuration.Configuration>>(qqntim.env.config);
    const [savedTitle, setSavedTitle] = useState<string>();

    const saveConfigAndRestart = () => {
        fs.writeJSONSync(qqntim.env.path.configFile, config);
        qqntim.app.relaunch();
    };

    useEffect(() => {
        document.body.classList.toggle(cl.panel.open.c, !!currentTab.type);
        qqntim.utils.waitForElement<HTMLElement>(".setting-title").then((element) => {
            if (currentTab.type) {
                setSavedTitle(element.innerText);
                element.innerText = currentTab.title;
            } else if (savedTitle) {
                element.innerText = savedTitle;
                setSavedTitle(undefined);
            }
        });
    }, [currentTab]);

    return (
        <>
            {currentTab.type == "settings" ? <SettingsPanel qqntim={qqntim} config={config} setConfig={setConfig} /> : currentTab.type == "plugins-manager" ? <PluginsManagerPanel qqntim={qqntim} config={config} setConfig={setConfig} /> : null}
            <button className={`${cl.panel.save.c} q-button q-button--default q-button--primary`} onClick={() => saveConfigAndRestart()}>
                <span className="q-button__slot-warp">保存并重启 QQ</span>
            </button>
        </>
    );
}

interface PanelsProps {
    qqntim: QQNTim.API.Renderer.API;
    config: Required<QQNTim.Configuration.Configuration>;
    setConfig: React.Dispatch<React.SetStateAction<Required<QQNTim.Configuration.Configuration>>>;
}

function SettingsPanel({ qqntim, config, setConfig }: PanelsProps) {
    return (
        <>
            <Section title="版本信息">
                <div className={cl.panel.settings.versions.c}>
                    {[
                        ["QQNTim", qqntim.version],
                        ["QQNT", qqntim.ntVersion],
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
                                "开启后，可以在控制台内查看到 IPC 通信、部分 Electron 对象的成员访问信息等",
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
                                "禁用后，LiteLoader 和 BetterQQNT 可能将不能与 QQNTim 一起使用。",
                                config.disableCompatibilityProcessing,
                                (state) =>
                                    setConfig((prev) => {
                                        return { ...prev, disableCompatibilityProcessing: state };
                                    }),
                            ],
                        ] as [string, string, boolean, (state: boolean) => void][]
                    ).map(([title, description, value, setValue], idx, array) => (
                        <SettingsBoxItem title={title} description={description} isLast={idx == array.length - 1}>
                            <Switch checked={value} onToggle={setValue} />
                        </SettingsBoxItem>
                    ))}
                </SettingsBox>
            </Section>
        </>
    );
}

function PluginsManagerPanel({ qqntim, config, setConfig }: PanelsProps) {
    const togglePluginState = (id: string, enabled: boolean) => {
        setConfig((prev) => {
            let _config = prev;
            if (enabled) {
                if (_config.plugins.whitelist && !_config.plugins.whitelist.includes(id))
                    _config = {
                        ..._config,
                        plugins: {
                            ..._config.plugins,
                            whitelist: [..._config.plugins.whitelist, id],
                        },
                    };
                else if (!_config.plugins.blacklist) _config.plugins.blacklist = [];
                console.log(_config.plugins.blacklist, id);
                if (_config.plugins.blacklist?.includes(id))
                    _config = {
                        ..._config,
                        plugins: {
                            ..._config.plugins,
                            blacklist: _config.plugins.blacklist.filter((value) => value != id),
                        },
                    };
            } else {
                if (_config.plugins.whitelist?.includes(id))
                    _config = {
                        ..._config,
                        plugins: {
                            ..._config.plugins,
                            whitelist: _config.plugins.whitelist.filter((value) => value != id),
                        },
                    };
                else if (!_config.plugins.blacklist) _config.plugins.blacklist = [];
                if (_config.plugins.blacklist && !_config.plugins.blacklist.includes(id))
                    _config = {
                        ..._config,
                        plugins: {
                            ..._config.plugins,
                            blacklist: [..._config.plugins.blacklist, id],
                        },
                    };
            }
            return _config;
        });
    };

    return (
        <>
            {Object.keys(qqntim.allPlugins).map((uin: string) => {
                const plugins = qqntim.allPlugins[uin];
                return (
                    <Section key={uin} title={uin == "" ? "对所有账号生效的插件" : `仅对账号 ${uin} 生效的插件`}>
                        <SettingsBox>
                            {Object.keys(plugins).map((id: string) => {
                                const plugin = plugins[id];
                                return (
                                    <SettingsBoxItem key={id} title={plugin.manifest.name} description={[!plugin.meetRequirements && "(当前环境不满足需求，未加载)", plugin.manifest.description || "该插件没有提供说明。"].filter(Boolean).join(" ")}>
                                        <Switch checked={!!(config.plugins.whitelist?.includes(id) || (config.plugins.blacklist && !config.plugins.blacklist.includes(id)) || (!config.plugins.blacklist && !config.plugins.whitelist))} onToggle={(state) => togglePluginState(id, state)} />
                                    </SettingsBoxItem>
                                );
                            })}
                        </SettingsBox>
                    </Section>
                );
            })}
        </>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className={cl.panel.section.c}>
            <h2 className={cl.panel.section.title.c}>{title}</h2>
            <div className={cl.panel.section.content.c}>{children}</div>
        </div>
    );
}

function SettingsBox({ children }: { children: ReactNode }) {
    return <div className={cl.panel.box.c}>{children}</div>;
}

function SettingsBoxItem({ title, description, children, isLast = false }: { title: string; description?: string; children: ReactNode; isLast?: boolean }) {
    return (
        <label className={`${cl.panel.box.item.c}${isLast ? ` ${cl.panel.box.item.last.c}` : ""}`}>
            <span>
                <span className={cl.panel.box.item.title.c}>{title}</span>
                {description ? <span className={cl.panel.box.item.description.c}>{description}</span> : null}
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
