interface Component {
    vnode: {
        el: VueElement;
        component: Component;
    };
    bum: Function[];
    uid: number;
}

interface VueElement extends HTMLElement {
    __VUE__?: Component[];
}

// Modified from https://greasyfork.org/zh-CN/scripts/449444-hook-vue3-app
// Thanks to DreamNya & Cesaryuan ;)

const elements = new WeakMap<VueElement, Component[]>();
(window as any).__VUE_ELEMENTS__ = elements;

function watchComponentUnmount(component: Component) {
    if (!component.bum) component.bum = [];
    component.bum.push(() => {
        const element = component.vnode.el;
        if (element) {
            const components = elements.get(element);
            if (components?.length == 1) elements.delete(element);
            else components?.splice(components.indexOf(component));
            if (element.__VUE__?.length == 1) element.__VUE__ = undefined;
            else element.__VUE__?.splice(element.__VUE__.indexOf(component));
        }
    });
}

function watchComponentMount(component: Component) {
    let value: HTMLElement;
    Object.defineProperty(component.vnode, "el", {
        get() {
            return value;
        },
        set(newValue) {
            value = newValue;
            if (value) recordComponent(component);
        },
    });
}

function recordComponent(component: Component) {
    let element = component.vnode.el;
    while (!(element instanceof HTMLElement)) element = (element as VueElement).parentElement!;

    // Expose component to element's __VUE__ property
    if (element.__VUE__) element.__VUE__.push(component);
    else element.__VUE__ = [component];

    // Add class to element
    element.classList.add("vue-component");

    // Map element to components
    const components = elements.get(element);
    if (components) components.push(component);
    else elements.set(element, [component]);

    watchComponentUnmount(component);
}

export function hookVue3() {
    window.Proxy = new Proxy(window.Proxy, {
        construct(target, [proxyTarget, proxyHandler]) {
            const component = proxyTarget?._ as Component;
            if (component?.uid >= 0) {
                const element = component.vnode.el;
                if (element) recordComponent(component);
                else watchComponentMount(component);
            }
            return new target(proxyTarget, proxyHandler);
        },
    });

    console.log("[!VueHelper] 输入 `__VUE_ELEMENTS__` 查看所有已挂载的 Vue 组件");
}
