let waitForElementSelectors: [string, (element: HTMLElement) => void][] = [];

export function startWatchingElement() {
    new MutationObserver(() => refreshStatus()).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}

export function refreshStatus() {
    waitForElementSelectors = waitForElementSelectors.filter(([selector, callback]) => {
        const element = document.querySelector<HTMLElement>(selector);
        element && callback(element);
        return !element;
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
