import { cl } from "./consts";
import type { QQNTim } from "@flysoftbeta/qqntim-typings";

const React = window.React;
const { Fragment, useEffect, useState } = React;

interface OtherTab {
    key?: undefined;
    type?: undefined;
}

interface PluginsManagerTab {
    key: string;
    type: "plugins-manager";
    title: string;
}

interface SettingsTab {
    key: string;
    type: "settings";
    title: string;
}

export type Tab = OtherTab | SettingsTab | PluginsManagerTab;

export function Navigation({ qqntim, vueId, onCurrentTabChange }: { qqntim: QQNTim.API.Renderer.API; vueId: string; onCurrentTabChange: (tab: Tab) => void }) {
    const [currentTab, setCurrentTab] = useState<Tab>({});
    useEffect(() => {
        qqntim.utils.waitForElement<HTMLElement>(".nav-bar").then((element) =>
            element.addEventListener("click", (event) => {
                const item = (event.target as HTMLElement).closest(".nav-item");
                if (!item) return;
                if (item.classList.contains(cl.nav.item.c)) return;
                setCurrentTab({});
            }),
        );
    }, []);
    useEffect(() => {
        if (currentTab.type) qqntim.utils.waitForElement<HTMLElement>(`.nav-item.nav-item-active:not(.${cl.nav.item.c})`).then((element) => element.classList.remove("nav-item-active"));
        onCurrentTabChange(currentTab);
    }, [currentTab]);

    return (
        <Fragment>
            {[{ key: "settings", type: "settings", title: "QQNTim 设置" } as SettingsTab, { key: "plugins-manager", type: "plugins-manager", title: "插件管理" } as PluginsManagerTab].map((item) => (
                <div key={item.key} className={`nav-item ${cl.nav.item.c} ${currentTab.key == item.key ? " nav-item-active" : ""}`} onClick={() => setCurrentTab(item)} {...{ [vueId]: "" }}>
                    <div className="name" {...{ [vueId]: "" }}>
                        {item.title}
                    </div>
                </div>
            ))}
        </Fragment>
    );
}
