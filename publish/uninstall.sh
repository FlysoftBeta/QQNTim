#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )"

if [ ! "$(whoami)" == "root" ]; then
    echo "The uninstallation script must be run by root user."
    exit -2
fi

qq_installation_dir=$( dirname $( readlink $( which qq ) ) )
if [ ! -d "$qq_installation_dir" ]; then
    echo "QQNT installation not found."
fi
qq_applauncher_dir="$qq_installation_dir/resources/app/app_launcher"

read -p "Do you want to uninstall QQNTim (y/n)?" choice
case $choice in
  y) ;;
  *) exit -1 ;;
esac

read -p "Also remove your data (y/n)?" choice
case $choice in
  y) rm -rf "$Home/.local/share/QQNTim" ;;
  *) ;;
esac

echo "Killing QQ processes..."
killall -vw qq

echo "Removing files..."
rm -vf "$qq_applauncher_dir/qqntim.js" "$qq_applauncher_dir/qqntim-renderer.js"

echo "Restoring entry..."
entry_file="$qq_applauncher_dir/index.js"
entry_file_backup="$entry_file.bak"
mv -vf "$entry_file_backup" "$entry_file"

echo "Uninstalled successfully."