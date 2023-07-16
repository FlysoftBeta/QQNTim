export const panels: [string, QQNTim.Settings.Panel, string | undefined][] = [];
let renderNav: Function = () => undefined;

export function defineSettingsPanels(...newSettingsPanels: [string, QQNTim.Settings.Panel, string | undefined][]) {
    panels.push(...newSettingsPanels);
    renderNav();
}

export function setRenderNavFunction(newFunction: Function) {
    renderNav = newFunction;
}
