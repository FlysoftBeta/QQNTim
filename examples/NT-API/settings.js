const { Fragment, createElement } = require("react");
const { defineSettingsPanels } = require("qqntim-settings");
const { SettingsSection, SettingsBox, SettingsBoxItem, Switch, Input, Dropdown } = require("qqntim-settings/components");
const { id, defaults } = require("./consts");

function SettingsPanel({ config, setConfig }) {
    return createElement(
        Fragment,
        undefined,
        createElement(
            SettingsSection,
            { title: "插件设置" },
            createElement(
                SettingsBox,
                undefined,
                createElement(
                    SettingsBoxItem,
                    { title: "显示账户信息", description: ["在控制台中显示当前登录的账户信息。"] },
                    createElement(Switch, {
                        checked: config?.[id]?.showAccountInfo != undefined ? config?.[id]?.showAccountInfo : defaults.showAccountInfo,
                        onToggle: (state) =>
                            setConfig((prev) => {
                                return {
                                    ...(prev || {}),
                                    [id]: {
                                        ...(prev[id] || {}),
                                        showAccountInfo: state,
                                    },
                                };
                            }),
                    }),
                ),
                createElement(
                    SettingsBoxItem,
                    { title: "显示历史消息", description: ["在控制台中显示历史 20 条消息。"] },
                    createElement(Switch, {
                        checked: config?.[id]?.showHistoryMessages != undefined ? config?.[id]?.showHistoryMessages : defaults.showHistoryMessages,
                        onToggle: (state) =>
                            setConfig((prev) => {
                                return {
                                    ...(prev || {}),
                                    [id]: {
                                        ...(prev[id] || {}),
                                        showHistoryMessages: state,
                                    },
                                };
                            }),
                    }),
                ),
                (config?.[id]?.showHistoryMessages != undefined ? config?.[id]?.showHistoryMessages : defaults.showHistoryMessages) &&
                    createElement(
                        SettingsBoxItem,
                        { title: "获取历史消息的对象" },
                        createElement(Dropdown, {
                            items: [
                                ["friends", "好友"],
                                ["groups", "群"],
                                ["both", "好友和群"],
                            ],
                            selected: config?.[id]?.historyMessageObject != undefined ? config?.[id]?.historyMessageObject : defaults.historyMessageObject,
                            onChange: (state) =>
                                setConfig((prev) => {
                                    return {
                                        ...(prev || {}),
                                        [id]: {
                                            ...(prev[id] || {}),
                                            historyMessageObject: state,
                                        },
                                    };
                                }),
                            width: "150px",
                        }),
                    ),
                createElement(
                    SettingsBoxItem,
                    { title: "自动回复", description: ["自动回复私聊消息。"] },
                    createElement(Switch, {
                        checked: config?.[id]?.autoReply != undefined ? config?.[id]?.autoReply : defaults.autoReply,
                        onToggle: (state) =>
                            setConfig((prev) => {
                                return {
                                    ...(prev || {}),
                                    [id]: {
                                        ...(prev[id] || {}),
                                        autoReply: state,
                                    },
                                };
                            }),
                    }),
                ),
                createElement(
                    SettingsBoxItem,
                    { title: "测试", description: ["测试输入框。"], isLast: true },
                    createElement(Input, {
                        value: config?.[id]?.testInputValue != undefined ? config?.[id]?.testInputValue : defaults.testInputValue,
                        onChange: (state) =>
                            setConfig((prev) => {
                                return {
                                    ...(prev || {}),
                                    [id]: {
                                        ...(prev[id] || {}),
                                        testInputValue: state,
                                    },
                                };
                            }),
                    }),
                ),
            ),
        ),
    );
}

module.exports.default = class Entry {
    constructor() {
        defineSettingsPanels([
            "Example-NT-API 设置",
            SettingsPanel,
            `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.0005 15C17.8572 15 20.173 12.6842 20.173 9.82756C20.173 6.97092 17.8572 4.65515 15.0005 4.65515H10.188C10.0247 4.65515 10.2276 4.85861 10.3157 4.99608C10.5913 5.42594 11.1765 6.21463 10.654 7.02266C10.1314 7.83069 9.82812 8.79371 9.82812 9.82756C9.82812 12.6842 12.1439 15 15.0005 15Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"></path><path d="M6.66406 24.3091C6.66406 21.2081 9.6191 18.1656 13.4146 18.1656C14.6987 18.1656 15.3023 18.1656 16.5864 18.1656C20.4854 18.1656 23.337 21.2081 23.337 24.3091C23.337 24.4334 23.2362 24.5341 23.1119 24.5341H6.88908C6.76481 24.5341 6.66406 24.4334 6.66406 24.3091Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"></path></svg>`,
        ]);
    }
};
