#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )/_"

if [ ! "$(whoami)" == "root" ]; then
    echo "正在提升权限……"
    sudo "${BASH_SOURCE[0]}"
    exit -2
fi

qq_installation_dir=$( dirname $( readlink $( which qq || which linuxqq ) ) )
if [ ! -d "$qq_installation_dir" ]; then
    echo "未找到 QQNT 安装目录。"
fi
qq_app_dir="$qq_installation_dir/resources/app"
qq_applauncher_dir="$qq_app_dir/app_launcher"
entry_file="$qq_applauncher_dir/index.js"
entry_backup_file="$qq_applauncher_dir/index.js.bak"
package_json_file="$qq_app_dir/package.json"
qqntim_flag_file="$qq_applauncher_dir/qqntim-flag.txt"

if [ -f "$entry_backup_file" ]; then
    echo "正在清理旧版 QQNTim……"
    mv -vf "$entry_backup_file" "$entry_file"
    touch "$qqntim_flag_file"
fi

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

echo "正在关闭 QQ……"
killall -vw qq

echo "正在移除文件……"
rm -vf "$qq_applauncher_dir/qqntim.js" "$qq_applauncher_dir/qqntim-renderer.js"
rm -vrf "$qq_applauncher_dir/node_modules" "$qq_applauncher_dir/builtins"

echo "正在还原 package.json……"
sed -i "s#\.\/app_launcher\/qqntim\.js#\.\/app_launcher\/index\.js#g" "$package_json_file"

rm -f "$qqntim_flag_file"

echo "卸载成功。卸载程序将在 5 秒后退出。"
sleep 5s
