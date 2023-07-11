import { QQNTim } from "@flysoftbeta/qqntim-typings";

export function isInWhitelist(id: string, whitelist?: string[]) {
    return !!(whitelist && !whitelist.includes(id));
}
export function isInBlacklist(id: string, blacklist?: string[]) {
    return !!blacklist?.includes(id);
}

function addItemToArray<T>(array: T[], item: T) {
    return [...array, item];
}
function removeItemFromArray<T>(array: T[], item: T) {
    return array.filter((value) => value != item);
}
export function enablePlugin(setConfig: React.Dispatch<React.SetStateAction<Required<QQNTim.Configuration.Configuration>>>, id: string, enable: boolean, inWhitelist: boolean, inBlacklist: boolean) {
    setConfig((prev) => {
        let _config = prev;
        if (_config.plugins.whitelist && enable != inWhitelist)
            _config = {
                ..._config,
                plugins: {
                    ..._config.plugins,
                    whitelist: (enable ? addItemToArray : removeItemFromArray)(_config.plugins.whitelist!, id),
                },
            };
        else if (!_config.plugins.blacklist) _config.plugins.blacklist = [];
        if (_config.plugins.blacklist && enable == inBlacklist)
            _config = {
                ..._config,
                plugins: {
                    ..._config.plugins,
                    blacklist: (!enable ? addItemToArray : removeItemFromArray)(_config.plugins.blacklist!, id),
                },
            };
        return _config;
    });
}

export function isPluginsExistent(qqntim: QQNTim.API.Renderer.API) {
    const { fs } = qqntim.modules;
    const ids: string[] = [];
    Object.keys(qqntim.allPlugins).forEach((uin) =>
        Object.keys(qqntim.allPlugins[uin]).forEach((id) => {
            const plugin = qqntim.allPlugins[uin][id];
            if (fs.existsSync(plugin.dir) && fs.statSync(plugin.dir).isDirectory()) ids.push(id);
        }),
    );
    return ids;
}

export function getPluginDescription(plugin: QQNTim.Plugin.Plugin) {
    const warnText = [!plugin.meetRequirements && "当前环境不满足需求，未加载", plugin.manifest.manifestVersion != "2.0" && "插件使用了过时的插件标准，请提醒作者更新"].filter(Boolean).join("; ");
    const description = plugin.manifest.description || "该插件没有提供说明。";
    return [warnText && `警告: ${warnText}。`, description].filter(Boolean);
}
