interface Component {
    vnode: {
        el: HTMLElement;
        component: Component;
    };
    bum: Function[];
    uid: number;
}

interface HTMLElement {
    // Cannot use `Component[]` because it will cause strange error
    __VUE__?: WeakSet<Component>;
}

const __VUE_ELEMENTS__ = (() => {
    // Modified from https://greasyfork.org/zh-CN/scripts/449444-hook-vue3-app
    // Thanks to DreamNya & Cesaryuan ;)

    const elements = new WeakMap<HTMLElement, Component[]>();

    const watchComponentMount = (component: Component) => {
        let hooked = false;
        component.vnode = new Proxy(component.vnode, {
            set(target) {
                if (!hooked && target.el) {
                    hooked = true;
                    recordComponent(target.el, target.component);
                }
                return true;
            },
        });
    };

    const watchComponentUnmount = (component: Component) => {
        if (!component.bum) component.bum = [];
        component.bum.push(() => {
            const element = component.vnode.el;
            if (element) {
                elements.delete(element);
                if (element.__VUE__) delete element.__VUE__;
            }
        });
    };

    const recordComponent = (element: HTMLElement, component: Component) => {
        if (element instanceof Text) element = element.parentElement!;

        // expose component to element's __VUE__ property
        if (element.__VUE__) {
            element.__VUE__.add(component);
        }
        else {
            element.__VUE__ = new WeakSet([component]);
        }

        // add class to element
        element.classList.add("vue-component");

        // map element to components
        let components = elements.get(element);
        if (components && !components.includes(component)) {
            components.push(component)
        } else {
            elements.set(element, [component]);
        }

        watchComponentUnmount(component);
    };

    window.Proxy = new Proxy(window.Proxy, {
        construct(target, [proxyTarget, proxyHandler]) {
            const component = proxyTarget?._ as Component;
            if (component?.uid >= 0) {
                const element = component.vnode.el;
                if (element) recordComponent(element, component);
                else watchComponentMount(component);
            }
            return new target(proxyTarget, proxyHandler);
        },
    });

    return elements;
})();

console.log("[!VueHelper] 输入 `__VUE_ELEMENTS__` 查看所有已挂载的 Vue 组件");
