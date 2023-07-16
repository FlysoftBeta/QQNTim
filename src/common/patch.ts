const modules: Record<string, any> = {};

export function defineModules(newModules: Record<string, any>) {
    for (const name in newModules) {
        if (modules[name]) throw new Error(`模块名已经被使用：${name}`);
        modules[name] = newModules[name];
    }
}

export function getModule(name: string) {
    return modules[name];
}
