#!/usr/bin/env bash

pushd "$( dirname "${BASH_SOURCE[0]}" )/_" > /dev/null

# 判断是否拥有 root 权限
if [ ! "$(whoami)" == "root" ]; then
    echo "正在提升权限……"
    popd > /dev/null
    sudo QQNTIM_UNINSTALLER_NO_KILL_QQ="$QQNTIM_UNINSTALLER_NO_KILL_QQ" QQNTIM_UNINSTALLER_NO_DELAYED_EXIT="$QQNTIM_UNINSTALLER_NO_DELAYED_EXIT" "${BASH_SOURCE[0]}"
    exit 0
fi

# 获取 QQ 安装路径
qq_installation_dir=$( dirname $( readlink $( which qq || which linuxqq ) ) 2>/dev/null || echo "/var/lib/flatpak/app/com.qq.QQ/current/active/files/extra/QQ"  )

if [ ! -d "$qq_installation_dir" ]; then
    echo "未找到 QQNT 安装目录。"
fi

qq_app_dir="$qq_installation_dir/resources/app"
qq_applauncher_dir="$qq_app_dir/app_launcher"
qqntim_flag_file="$qq_applauncher_dir/qqntim-flag.txt"

if [ ! -f "$qqntim_flag_file" ]; then
    echo "QQNTim 未被安装。"
    exit -1
fi

read -p "是否要卸载 QQNTim (y/n)？" choice
case $choice in
  y) ;;
  *) exit -1 ;;
esac

read -p "是否需要同时移除所有数据 (y/n)？" choice
case $choice in
  y) rm -rf "$HOME/.local/share/QQNTim" ;;
  *) ;;
esac

if [ "$QQNTIM_UNINSTALLER_NO_KILL_QQ" != "1" ]; then
    echo "正在关闭 QQ……"
    killall -w qq linuxqq > /dev/null 2>&1
fi

echo "正在移除文件……"
[ -f "$qq_applauncher_dir/node_modules.zip.md5" ] && rm -f "$qq_applauncher_dir/node_modules.zip.md5"
rm -rf "$qq_applauncher_dir/qqntim.js" "$qq_applauncher_dir/qqntim-renderer.js" "$qq_applauncher_dir/node_modules" "$qq_applauncher_dir/builtins"

echo "正在还原 package.json……"
sed -i "s#\.\/app_launcher\/qqntim\.js#\.\/app_launcher\/index\.js#g" "$qq_app_dir/package.json"

rm -f "$qqntim_flag_file"

if [ "$QQNTIM_UNINSTALLER_NO_DELAYED_EXIT" != "1" ]; then
    echo "卸载成功。卸载程序将在 5 秒后自动退出。"
    sleep 5s
else
    echo "卸载成功。"
fi
exit 0
