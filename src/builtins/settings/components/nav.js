const { cl } = require("../consts");
const { createElement: e, Fragment, useEffect, useState } = window.React;

function Navigation({ vueId, qqntim, onCurrentTabChange }) {
    const [currentTab, setCurrentTab] = useState({});
    useEffect(() => {
        qqntim.utils.waitForElement(".nav-bar").then((nav) => {
            nav.addEventListener("click", (event) => {
                const item = event.target.closest(".nav-item");
                if (!item) return;
                if (item.classList.contains(cl.nav.item.c)) return;
                setCurrentTab({});
            });
        });
    }, []);
    useEffect(() => onCurrentTabChange(currentTab));

    return e(
        Fragment,
        null,
        [{ key: "settings", type: "settings", data: null, title: "QQNTim 设置" }].map((item) =>
            e(
                "div",
                {
                    key: item.key,
                    className: `nav-item qqntim-settings-nav-item ${currentTab.key == item.key ? " nav-item-active" : ""}`,
                    [vueId]: "",
                    onClick: () => setCurrentTab(item),
                },
                item.title,
            ),
        ),
    );
}

module.exports = { Navigation };
