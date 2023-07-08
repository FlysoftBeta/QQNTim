import { getter, setter } from "../watch";

interface Component {
    vnode: {
        el: VueElement;
        component: Component;
    };
    bum: Function[];
    uid: number;
}

interface VueElement extends HTMLElement {
    __VUE__?: WeakSet<Component>;
}

(window as any).__VUE_ELEMENTS__ = (() => {
    // Modified from https://greasyfork.org/zh-CN/scripts/449444-hook-vue3-app
    // Thanks to DreamNya & Cesaryuan ;)

    const elements = new WeakMap<VueElement, WeakSet<Component>>();

    const watchComponentMount = (component: Component) => {
        component.vnode = new Proxy(component.vnode, {
            get(target, p) {
                return getter(undefined, target, p as any);
            },
            set(target, p, newValue) {
                if (p == "el" && target.el) {
                    recordComponent(target.component);
                }
                return setter(undefined, target, p as any, newValue);
            },
        });
    };

    const watchComponentUnmount = (component: Component) => {
        if (!component.bum) component.bum = [];
        component.bum.push(() => {
            const element = component.vnode.el;
            if (element) {
                elements.delete(element);
                if (element.__VUE__) element.__VUE__ = undefined;
            }
        });
    };

    const recordComponent = (component: Component) => {
        const element = component.vnode.el instanceof Text ? (component.vnode.el.parentElement! as VueElement) : component.vnode.el;

        // Expose component to element's __VUE__ property
        if (element.__VUE__) {
            element.__VUE__.add(component);
        } else {
            element.__VUE__ = new WeakSet([component]);
        }

        // Add class to element
        element.classList.add("vue-component");

        // Map element to components
        const components = elements.get(element);
        if (components) components.add(component);
        else elements.set(element, new WeakSet([component]));

        watchComponentUnmount(component);
    };

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

    return elements;
})();

console.log("[!VueHelper] 输入 `__VUE_ELEMENTS__` 查看所有已挂载的 Vue 组件");
