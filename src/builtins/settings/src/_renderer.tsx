import { Navigation, Tab } from "./components/nav";
import { Panel } from "./components/panel";
import { cl } from "./consts";
import type { QQNTim } from "@flysoftbeta/qqntim-typings";
const React = window.React;
const { createRoot } = window.ReactDOMClient;

export default class Entry implements QQNTim.Entry.Renderer {
    constructor(qqntim: QQNTim.API.Renderer.API) {
        const elements = Promise.all([qqntim.utils.waitForElement<HTMLElement>(".nav-bar:not(.qqntim-settings-nav)"), qqntim.utils.waitForElement<HTMLElement>(".setting-main"), qqntim.utils.waitForElement<HTMLElement>(`.setting-main .setting-main__content:not(.${cl.panel.c})`)]);
        elements.then(([nav, panel, panelContent]) => {
            const panelVueId = qqntim.utils.getVueId(panelContent)!;
            const panelContainer = document.createElement("div");
            panelContainer.classList.add("setting-main__content", cl.panel.c);
            panelContainer.setAttribute(panelVueId, "");
            const panelRoot = createRoot(panelContainer);
            const renderPanel = (currentTab: Tab) => {
                panelRoot.render(<Panel qqntim={qqntim} currentTab={currentTab} />);
            };
            panel.appendChild(panelContainer);

            const navVueId = qqntim.utils.getVueId(nav.firstElementChild as HTMLElement)!;
            const navContainer = document.createElement("div");
            navContainer.classList.add(cl.nav.c);
            createRoot(navContainer).render(<Navigation vueId={navVueId} onCurrentTabChange={renderPanel} />);
            nav.appendChild(navContainer);
        });
    }
    onWindowLoaded(): void {}
}
