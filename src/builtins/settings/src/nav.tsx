import { panels } from "./exports";
import { cl } from "./utils/consts";
import { utils } from "qqntim/renderer";
import { Fragment, useEffect, useState } from "react";

interface OtherTab {
    key?: undefined;
    type?: undefined;
    title?: string;
    icon?: string;
}

interface PluginsManagerTab {
    key: string;
    type: "plugins-manager";
    title: string;
    icon: string;
}

interface SettingsTab {
    key: string;
    type: "settings";
    title: string;
    icon: string;
}

interface PluginTab {
    key: string;
    type: "plugin";
    title: string;
    icon: string | undefined;
    node: QQNTim.Settings.Panel;
}

export type Tab = PluginsManagerTab | SettingsTab | PluginTab;
export type TabWithOtherTab = Tab | OtherTab;

export function Navigation({ vueId, onCurrentTabChange }: { vueId: string; onCurrentTabChange: (tab: TabWithOtherTab) => void }) {
    const [currentTab, setCurrentTab] = useState<TabWithOtherTab>({});
    useEffect(() => {
        utils.waitForElement<HTMLElement>(".nav-bar").then((element) =>
            element.addEventListener("click", (event) => {
                const item = (event.target as HTMLElement).closest(".nav-item");
                if (!item) return;
                if (item.classList.contains(cl.nav.item.c)) return;
                item.classList.toggle("nav-item-active", true);

                const title = item.firstElementChild?.nextElementSibling as HTMLElement;
                if (title) setCurrentTab({ title: title.innerText });
            }),
        );
    }, []);
    useEffect(() => {
        if (currentTab.type) utils.waitForElement<HTMLElement>(`.nav-item.nav-item-active:not(.${cl.nav.item.c})`).then((element) => element.classList.remove("nav-item-active"));
        onCurrentTabChange(currentTab);
    }, [currentTab]);

    const tabs: Tab[] = [
        {
            key: "settings",
            type: "settings",
            title: "QQNTim 设置",
            icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 2.15771L13 5.07438L13 10.9256L8 13.8423L3 10.9256L3 5.07438L8 2.15771ZM7.49613 1.29394C7.80749 1.11231 8.19251 1.11231 8.50387 1.29394L13.5039 4.2106C13.8111 4.38981 14 4.71871 14 5.07438V10.9256C14 11.2813 13.8111 11.6102 13.5039 11.7894L8.50387 14.7061C8.19251 14.8877 7.80749 14.8877 7.49613 14.7061L2.49613 11.7894C2.18891 11.6102 2 11.2813 2 10.9256V5.07438C2 4.71871 2.18891 4.38981 2.49613 4.2106L7.49613 1.29394ZM10.2633 6.09507L5 9.13385L5.5 9.99988L10.7633 6.96109L10.2633 6.09507Z" fill="currentColor"></path></svg>`,
        },
        {
            key: "plugins-manager",
            type: "plugins-manager",
            title: "插件管理",
            icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.75" y="3.75" width="6.5" height="6.5" rx="1.25" stroke="currentColor" stroke-width="1.5"></rect><rect x="12.4038" y="7" width="6.5" height="6.5" rx="1.25" transform="rotate(-45 12.4038 7)" stroke="currentColor" stroke-width="1.5"></rect><rect x="3.75" y="13.75" width="6.5" height="6.5" rx="1.25" stroke="currentColor" stroke-width="1.5"></rect><rect x="13.75" y="13.75" width="6.5" height="6.5" rx="1.25" stroke="currentColor" stroke-width="1.5"></rect></svg>`,
        },
        ...panels.map(([title, node, icon], idx): PluginTab => {
            return {
                key: `plugin-${idx}`,
                type: "plugin",
                title: title,
                icon: icon,
                node: node,
            };
        }),
    ];

    return (
        <Fragment>
            {tabs.map((item) => (
                <div key={item.key} className={`nav-item ${cl.nav.item.c}${currentTab.key == item.key ? " nav-item-active" : ""}`} onClick={() => setCurrentTab(item)} {...{ [vueId]: "" }}>
                    {!!item.icon && (
                        <i
                            className="q-icon icon"
                            /* rome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */
                            dangerouslySetInnerHTML={{ __html: item.icon }}
                            style={{
                                width: "16px",
                                height: "16px",
                                marginRight: "8px",
                                alignItems: "center",
                                color: "inherit",
                                display: "inline-flex",
                                justifyContent: "center",
                            }}
                        />
                    )}
                    <div className="name" {...{ [vueId]: "" }}>
                        {item.title}
                    </div>
                </div>
            ))}
        </Fragment>
    );
}
