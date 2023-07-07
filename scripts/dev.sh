#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )/.."

qq_installation_dir=$( dirname $( readlink $( which qq ) ) )
if [ ! -d "$qq_installation_dir" ]; then
    echo "未找到 QQNT 安装目录。"
fi
qq_app_dir="$qq_installation_dir/resources/app"
qq_applauncher_dir="$qq_app_dir/app_launcher"
package_json_file="$qq_app_dir/package.json"

sudo cp -f ./dist/_/qqntim.js ./dist/_/qqntim-renderer.js "$qq_applauncher_dir"
sudo cp -rf ./dist/_/node_modules "$qq_applauncher_dir"
sudo sed -i "s#\.\/app_launcher\/index\.js#\.\/app_launcher\/qqntim\.js#g" "$package_json_file"

qq 2>&1 | sed -e '/NODE_TLS_REJECT_UNAUTHORIZED/d' -e '/Gtk-Message/d' -e '/to show where the warning was created/d' -e '/gbm_wrapper\.cc/d' -e '/node_bindings\.cc/d' -e '/UnhandledPromiseRejectionWarning/d' -e '/\[BuglyManager\.cpp\]/d' -e '/\[NativeCrashHandler\.cpp\]/d' -e '/\[BuglyService\.cpp\]/d' -e '/\[HotUpdater\]/d'