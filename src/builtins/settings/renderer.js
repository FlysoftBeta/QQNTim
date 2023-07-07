const { cl } = require("./consts");
const { Navigation } = require("./components/nav");
const { Panel } = require("./components/panel");
const { createElement: e } = window.React;
const { createRoot } = window.ReactDOMClient;

module.exports = (qqntim) => {
    qqntim.utils.waitForElement(".nav-bar:not(.qqntim-settings-nav)").then((nav) => {
        qqntim.utils.waitForElement(".setting-main").then((panel) => {
            qqntim.utils.waitForElement(`.setting-main .setting-main__content:not(.${cl.panel.c})`).then((panelContent) => {
                const panelVueId = qqntim.utils.getVueId(panelContent);
                const panelContainer = document.createElement("div");
                panelContainer.classList.add("setting-main__content", cl.panel.c);
                panelContainer.setAttribute(panelVueId, "");
                const panelRoot = createRoot(panelContainer);
                const renderPanel = (currentTab) => {
                    panelRoot.render(e(Panel, { vueId: panelVueId, currentTab, qqntim }));
                };
                panel.appendChild(panelContainer);

                const navVueId = qqntim.utils.getVueId(nav.firstElementChild);
                const navContainer = document.createElement("div");
                navContainer.classList.add(cl.nav.c);
                createRoot(navContainer).render(
                    e(Navigation, {
                        vueId: navVueId,
                        qqntim,
                        onCurrentTabChange: renderPanel,
                    }),
                );
                nav.appendChild(navContainer);
            });
        });
    });
};
