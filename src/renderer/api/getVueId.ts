export function getVueId(element: HTMLElement) {
    let vueId: string | undefined;

    for (const item in element.dataset) {
        if (item.startsWith("v"))
            vueId = `data-${item
                .split("")
                .map((item) => {
                    const low = item.toLocaleLowerCase();
                    if (low != item) return `-${low}`;
                    else return low;
                })
                .join("")}`;
    }

    return vueId;
}
