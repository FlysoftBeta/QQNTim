import { cl } from "../consts";
import type { QQNTim } from "@flysoftbeta/qqntim-typings";
const React = window.React;
const { Fragment, useEffect, useState } = React;

interface OtherTab {
    key?: undefined;
    type?: undefined;
}

interface SettingsTab {
    key: string;
    type: "settings";
    title: string;
}

export type Tab = OtherTab | SettingsTab;

export function Navigation({ vueId, onCurrentTabChange }: { vueId: string; onCurrentTabChange: (tab: Tab) => void }) {
    const [currentTab, setCurrentTab] = useState<Tab>({});
    useEffect(() => {
        document.querySelector<HTMLElement>(".nav-bar")!.addEventListener("click", (event) => {
            const item = (event.target as HTMLElement).closest(".nav-item");
            if (!item) return;
            if (item.classList.contains(cl.nav.item.c)) return;
            setCurrentTab({});
        });
    }, []);
    useEffect(() => {
        if (currentTab.type) document.querySelector<HTMLElement>(`.nav-item.nav-item-active:not(.${cl.nav.item.c})`)!.classList.remove("nav-item-active");
        onCurrentTabChange(currentTab);
    }, [currentTab]);

    return (
        <Fragment>
            {[{ key: "settings", type: "settings", title: "QQNTim 设置" } as SettingsTab].map((item) => (
                <div key={item.key} className={`nav-item ${cl.nav.item.c} ${currentTab.key == item.key ? " nav-item-active" : ""}`} onClick={() => setCurrentTab(item)} {...{ [vueId]: "" }}>
                    {item.title}
                </div>
            ))}
        </Fragment>
    );
}
