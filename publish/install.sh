#!/usr/bin/env bash

pushd "$( dirname "${BASH_SOURCE[0]}" )/_" > /dev/null

# 判断是否拥有 root 权限
if [ ! "$(whoami)" == "root" ]; then
    echo "正在提升权限……"
    popd > /dev/null
    sudo QQNTIM_INSTALLER_NO_KILL_QQ="$QQNTIM_INSTALLER_NO_KILL_QQ" "${BASH_SOURCE[0]}"
    exit 0
fi

# 获取 QQ 安装路径
qq_installation_dir=$( dirname $( readlink $( which qq || which linuxqq ) ) 2>/dev/null || echo "/var/lib/flatpak/app/com.qq.QQ/current/active/files/extra/QQ" )

if [ ! -d "$qq_installation_dir" ]; then
    echo "未找到 QQNT 安装目录。"
fi

qq_app_dir="$qq_installation_dir/resources/app"
qq_applauncher_dir="$qq_app_dir/app_launcher"
qqntim_flag_file="$qq_applauncher_dir/qqntim-flag.txt"

# 清理旧版文件，恢复被修改的入口文件
if [ -f "$qq_applauncher_dir/index.js.bak" ]; then
    echo "正在清理旧版 QQNTim……"
    mv -f "$qq_applauncher_dir/index.js.bak" "$qq_applauncher_dir/index.js"
    touch "$qqntim_flag_file"
fi

# 询问用户，如果存在旧版则不提示
if [ ! -f "$qqntim_flag_file" ]; then
    read -p "是否要安装 QQNTim (y/n)？" choice
    case $choice in
    y) ;;
    Y) ;;
    *) exit -1 ;;
    esac
else
    echo "检测到已有安装，正在更新……"
fi

if [ "$QQNTIM_INSTALLER_NO_KILL_QQ" != "1" ]; then
    echo "正在关闭 QQ……"
    killall -w qq linuxqq > /dev/null 2>&1
fi

echo "正在复制文件……"

if [ -f "./node_modules.zip.md5" -a -f "./node_modules.zip" ]; then
    diff "$qq_applauncher_dir/node_modules.zip.md5" "./node_modules.zip.md5" > /dev/null 2>&1
    [ $? != 0 ] && unzip -qo ./node_modules.zip -d "$qq_applauncher_dir/node_modules"
    cp -f ../node_modules.zip.md5 "$qq_applauncher_dir"
elif [ -d "./node_modules" ]; then
    cp -rf ./node_modules "$qq_applauncher_dir"
fi
cp -rf ./qqntim.js ./qqntim-renderer.js ./builtins "$qq_applauncher_dir"

echo "正在修补 package.json……"
sed -i "s#\.\/app_launcher\/index\.js#\.\/app_launcher\/qqntim\.js#g" "$qq_app_dir/package.json"

touch "$qqntim_flag_file"

if [ "$QQNTIM_INSTALLER_NO_DELAYED_EXIT" != "1" ]; then
    echo "安装成功。安装程序将在 5 秒后自动退出。"
    sleep 5s
else
    echo "安装成功。"
fi

exit 0
