#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )"

if [ ! "$(whoami)" == "root" ]; then
    echo "The installation script must be run by root user."
    exit -2
fi

qq_installation_dir="/opt/QQ"
if [ ! -d "$qq_installation_dir" ]; then
    echo "QQNT installation not found."
fi
qq_applauncher_dir="$qq_installation_dir/resources/app/app_launcher"

read -p "Do you want to install QQNTim (y/n)?" choice
case $choice in
  y) ;;
  *) exit -1 ;;
esac

echo "Killing QQ processes..."
killall -vw qq

echo "Copying files..."
cp -vf ./qqntim.js ./qqntim-renderer.js "$qq_applauncher_dir"

entry_file="$qq_applauncher_dir/index.js"
entry_file_backup="$entry_file.bak"
if [ ! -f "$entry_file_backup" ]; then
    echo "Patching entry..."
    cp -vf "$entry_file" "$entry_file_backup"
    echo "require(\"./qqntim\");" | cat - "$entry_file" > "$entry_file.tmp"
    mv -vf "$entry_file.tmp" "$entry_file"
fi

echo "Installed successfully."