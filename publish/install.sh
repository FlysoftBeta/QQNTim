#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )/_"

if [ ! "$(whoami)" == "root" ]; then
    echo "正在提升权限……"
    sudo "${BASH_SOURCE[0]}"
    exit -2
fi

qq_installation_dir=$( dirname $( readlink $( which qq ) ) )
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
    read -p "是否要安装 QQNTim (y/n)？" choice
    case $choice in
    y) ;;
    *) exit -1 ;;
    esac
fi

echo "正在关闭 QQ……"
killall -vw qq

echo "正在复制文件……"
mkdir -p "$qq_applauncher_dir/node_modules"
cp -vf ./qqntim.js ./qqntim-renderer.js "$qq_applauncher_dir"
cp -vrf ./node_modules ./builtins "$qq_applauncher_dir"

echo "正在修补 package.json……"
sed -i "s#\.\/app_launcher\/index\.js#\.\/app_launcher\/qqntim\.js#g" "$package_json_file"

touch "$qqntim_flag_file"

echo "安装成功。安装程序将在 5 秒后退出。"
sleep 5s
