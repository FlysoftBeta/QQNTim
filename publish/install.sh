#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )"

if [ ! "$(whoami)" == "root" ]; then
    echo "The installation script must be run by root user."
    exit -2
fi

qq_installation_dir=$( dirname $( readlink $( which qq ) ) )
if [ ! -d "$qq_installation_dir" ]; then
    echo "QQNT installation not found."
fi
qq_app_dir="$qq_installation_dir/resources/app"
qq_applauncher_dir="$qq_app_dir/app_launcher"
entry_file="$qq_applauncher_dir/index.js"
entry_backup_file="$qq_applauncher_dir/index.js.bak"
package_json_file="$qq_app_dir/package.json"
qqntim_flag_file="$qq_applauncher_dir/qqntim-flag.txt"

if [ -f "$entry_backup_file" ]; then
    echo "Cleaning up old installation..."
    mv -vf "$entry_backup_file" "$entry_file"
    touch "$qqntim_flag_file"
fi

if [ ! -f "$qqntim_flag_file" ]; then
    read -p "Do you want to install QQNTim (y/n)?" choice
    case $choice in
    y) ;;
    *) exit -1 ;;
    esac
fi

echo "Killing QQ processes..."
killall -vw qq

echo "Copying files..."
mkdir -p "$qq_applauncher_dir/node_modules"
cp -vf ./qqntim.js ./qqntim-renderer.js "$qq_applauncher_dir"
cp -vrf ./node_modules/* "$qq_applauncher_dir/node_modules"

echo "Patching package.json..."
sed -i "s#\.\/app_launcher\/index\.js#\.\/app_launcher\/qqntim\.js#g" "$package_json_file"

touch "$qqntim_flag_file"

echo "Installed successfully. Installer will exit in 5 sec."
sleep 5s
