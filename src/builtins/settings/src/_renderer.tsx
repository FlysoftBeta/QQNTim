import { cl } from "./consts";
import { Navigation, Tab } from "./nav";
import { Panel } from "./panel";
import type { QQNTim } from "@flysoftbeta/qqntim-typings";
const React = window.React;
const { createRoot } = window.ReactDOMClient;

export default class Entry implements QQNTim.Entry.Renderer {
    constructor(qqntim: QQNTim.API.Renderer.API) {
        Promise.all([qqntim.nt.getAccountInfo(), qqntim.utils.waitForElement<HTMLElement>(".nav-bar:not(.qqntim-settings-nav)"), qqntim.utils.waitForElement<HTMLElement>(".setting-main"), qqntim.utils.waitForElement<HTMLElement>(`.setting-main .setting-main__content:not(.${cl.panel.c})`)]).then(
            ([account, nav, panel, panelContent]) => {
                if (!account) throw new Error("获取当前账户信息时失败");

                const panelVueId = qqntim.utils.getVueId(panelContent)!;
                const panelContainer = document.createElement("div");
                panelContainer.classList.add("setting-main__content", cl.panel.c);
                panelContainer.setAttribute(panelVueId, "");
                const panelRoot = createRoot(panelContainer);
                const renderPanel = (currentTab: Tab) => {
                    panelRoot.render(<Panel qqntim={qqntim} currentTab={currentTab} account={account} />);
                };
                panel.appendChild(panelContainer);

                const navVueId = qqntim.utils.getVueId(nav.firstElementChild as HTMLElement)!;
                const navContainer = document.createElement("div");
                navContainer.classList.add(cl.nav.c);
                createRoot(navContainer).render(<Navigation qqntim={qqntim} vueId={navVueId} onCurrentTabChange={renderPanel} />);
                nav.appendChild(navContainer);
            },
        );
    }
    onWindowLoaded(): void {}
}
