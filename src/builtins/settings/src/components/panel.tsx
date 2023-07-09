import { cl } from "../consts";
import { Tab } from "./nav";
import type { QQNTim } from "@flysoftbeta/qqntim-typings";
const React = window.React;
const { useEffect, useState } = React;

export function Panel({ qqntim, currentTab }: { qqntim: QQNTim.API.Renderer.API; currentTab: Tab }) {
    const [savedTitle, setSavedTitle] = useState<string>();

    useEffect(() => {
        document.body.classList.toggle(cl.panel.open.c, !!currentTab.type);
        const title = document.querySelector<HTMLElement>(".setting-title")!;
        if (currentTab.type) {
            setSavedTitle(title.innerText);
            title.innerText = currentTab.title;
        } else if (savedTitle) {
            title.innerText = savedTitle;
            setSavedTitle(undefined);
        }
    }, [currentTab]);

    return currentTab.type == "settings" ? (
        <div className={cl.panel.settings.c}>
            <div className={cl.panel.section.c}>
                <h2 className={cl.panel.section.title.c}>版本信息</h2>
                <div className={cl.panel.section.content.c}>
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
                </div>
            </div>
        </div>
    ) : undefined;
}
