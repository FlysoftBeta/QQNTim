const waitForElementSelectors: [string, (element: HTMLElement) => void][] = [];

export function startWatchingElement() {
    new MutationObserver(() => refreshStatus()).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}

export function refreshStatus() {
    waitForElementSelectors.forEach((item, idx) => {
        const ele = document.querySelector<HTMLElement>(item[0]);
        if (ele) {
            item[1](ele);
            waitForElementSelectors.splice(idx);
        }
    });
}

export function waitForElement(selector: string) {
    return new Promise<HTMLElement>((resolve) => {
        waitForElementSelectors.push([
            selector,
            (element) => {
                resolve(element);
            },
        ]);
        refreshStatus();
    });
}
