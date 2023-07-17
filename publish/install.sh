#!/usr/bin/env bash

pushd "$( dirname "${BASH_SOURCE[0]}" )/_" > /dev/null

if [ ! "$(whoami)" == "root" ]; then
    echo "正在提升权限……"
    popd > /dev/null
    sudo QQNTIM_INSTALLER_NO_KILL_QQ="$QQNTIM_INSTALLER_NO_KILL_QQ" "${BASH_SOURCE[0]}"
    exit 0
fi

qq_installation_dir=$( dirname $( readlink $( which qq || which linuxqq ) ) || echo "/var/lib/flatpak/app/com.qq.QQ/current/active/files/extra/QQ" )
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
    mv -f "$entry_backup_file" "$entry_file"
    touch "$qqntim_flag_file"
fi

if [ ! -f "$qqntim_flag_file" ]; then
    read -p "是否要安装 QQNTim (y/n)？" choice
    case $choice in
    y) ;;
    Y) ;;
    *) exit -1 ;;
    esac
fi

if [ "$QQNTIM_INSTALLER_NO_KILL_QQ" != "1" ]; then
    echo "正在关闭 QQ……"
    killall -w qq linuxqq
fi

echo "正在复制文件……"
mkdir -p "$qq_applauncher_dir/node_modules"
cp -f ./qqntim.js ./qqntim-renderer.js "$qq_applauncher_dir"
cp -rf ./node_modules ./builtins "$qq_applauncher_dir"

echo "正在修补 package.json……"
sed -i "s#\.\/app_launcher\/index\.js#\.\/app_launcher\/qqntim\.js#g" "$package_json_file"

touch "$qqntim_flag_file"

echo "安装成功。"
exit 0
