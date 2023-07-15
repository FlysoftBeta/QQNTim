import { Navigation, Tab } from "./nav";
import { Panel } from "./panel";
import { cl } from "./utils/consts";
import { nt, utils } from "qqntim/renderer";
import { createRoot } from "react-dom/client";

export default class Entry implements QQNTim.Entry.Renderer {
    constructor() {
        Promise.all([nt.getAccountInfo(), utils.waitForElement<HTMLElement>(".nav-bar:not(.qqntim-settings-nav)"), utils.waitForElement<HTMLElement>(".setting-main"), utils.waitForElement<HTMLElement>(`.setting-main .setting-main__content:not(.${cl.panel.c})`)]).then(
            ([account, nav, panel, panelContent]) => {
                if (!account) throw new Error("获取当前账户信息时失败");

                const panelVueId = utils.getVueId(panelContent)!;
                const panelContainer = document.createElement("div");
                panelContainer.classList.add("setting-main__content", cl.panel.c);
                panelContainer.setAttribute(panelVueId, "");
                const panelRoot = createRoot(panelContainer);
                const renderPanel = (currentTab: Tab) => {
                    panelRoot.render(<Panel currentTab={currentTab} account={account} />);
                };
                panel.appendChild(panelContainer);

                const navVueId = utils.getVueId(nav.firstElementChild as HTMLElement)!;
                const navContainer = document.createElement("div");
                navContainer.classList.add(cl.nav.c);
                createRoot(navContainer).render(<Navigation vueId={navVueId} onCurrentTabChange={renderPanel} />);
                nav.appendChild(navContainer);
            },
        );
    }
    onWindowLoaded(): void {}
}
