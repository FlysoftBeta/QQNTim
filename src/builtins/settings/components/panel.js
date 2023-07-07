const { cl } = require("../consts");
const { createElement: e, Fragment, useEffect, useState } = window.React;

function Panel({ qqntim, currentTab }) {
    const [savedTitle, setSavedTitle] = useState(undefined);

    useEffect(() => {
        document.body.classList.toggle(cl.panel.open.c, !!currentTab.type);
        qqntim.utils.waitForElement(".setting-title").then((title) => {
            if (currentTab.type) {
                setSavedTitle(title.innerText);
                title.innerText = currentTab.title;
            } else if (savedTitle) {
                title.innerText = savedTitle;
                setSavedTitle(undefined);
            }
        });
    }, [currentTab]);

    return currentTab.type == "settings"
        ? e(
              "div",
              { className: cl.panel.settings.c },
              e(
                  "div",
                  { className: cl.panel.section.c },
                  e("h2", { className: cl.panel.section.title.c }, "版本信息"),
                  e(
                      "div",
                      {
                          className: cl.panel.section.content.c,
                      },
                      e(
                          "div",
                          {
                              className: cl.panel.settings.versions.c,
                          },
                          ...[
                              ["QQNTim", qqntim.version],
                              ["QQNT", qqntim.ntVersion],
                              ["Electron", process.versions.electron],
                              ["Node.js", process.versions.node],
                              ["Chromium", process.versions.chrome],
                              ["V8", process.versions.v8],
                          ].map(([name, version]) =>
                              e(
                                  "div",
                                  {
                                      className: cl.panel.settings.versions.item.c,
                                  },
                                  e(
                                      "h3",
                                      {
                                          className: cl.panel.settings.versions.item.c,
                                      },
                                      name,
                                  ),
                                  e(
                                      "div",
                                      {
                                          className: cl.panel.settings.versions.item.c,
                                      },
                                      version,
                                  ),
                              ),
                          ),
                      ),
                  ),
              ),
          )
        : null;
}

module.exports = { Panel };
