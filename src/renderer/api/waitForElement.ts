let waitForElementSelectors: [string, (element: Element) => void][] = [];

export function startWatchingElement() {
    new MutationObserver(() => refreshStatus()).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}

export function refreshStatus() {
    waitForElementSelectors = waitForElementSelectors.filter(([selector, callback]) => {
        const element = document.querySelector<Element>(selector);
        element && callback(element);
        return !element;
    });
}

export function waitForElement<T extends Element>(selector: string) {
    return new Promise<T>((resolve) => {
        waitForElementSelectors.push([
            selector,
            (element) => {
                resolve(element as T);
            },
        ]);
        refreshStatus();
    });
}
