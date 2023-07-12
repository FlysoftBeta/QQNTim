#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )/.."

qq_installation_dir=$( dirname $( readlink $( which qq || which linuxqq ) ) )
if [ ! -d "$qq_installation_dir" ]; then
    echo "未找到 QQNT 安装目录。"
fi
qq_app_dir="$qq_installation_dir/resources/app"
qq_applauncher_dir="$qq_app_dir/app_launcher"
package_json_file="$qq_app_dir/package.json"

sudo cp -f ./dist/_/qqntim.js ./dist/_/qqntim-renderer.js "$qq_applauncher_dir"
sudo cp -rf ./dist/_/node_modules ./dist/_/builtins "$qq_applauncher_dir"
sudo sed -i "s#\.\/app_launcher\/index\.js#\.\/app_launcher\/qqntim\.js#g" "$package_json_file"
echo "环境准备完毕。"