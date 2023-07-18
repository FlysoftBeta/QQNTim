#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )/.."

pushd ./dist/_/node_modules > /dev/null

# 设置特定时间戳，确保两次构建结果 Hash 不变
find . -exec touch -d @0 {} +

# 打包 node_modules
zip -Xyqr9 ../node_modules.zip .

popd > /dev/null

rm -rf ./dist/_/node_modules

# 生成 MD5 校验和
(md5sum -b ./dist/_/node_modules.zip | cut -d" " -f1) > ./dist/_/node_modules.zip.md5