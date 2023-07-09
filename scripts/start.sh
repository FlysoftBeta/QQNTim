#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )/.."

qq 2>&1 | sed -e '/NODE_TLS_REJECT_UNAUTHORIZED/d' -e '/Gtk-Message/d' -e '/to show where the warning was created/d' -e '/gbm_wrapper\.cc/d' -e '/node_bindings\.cc/d' -e '/UnhandledPromiseRejectionWarning/d' -e '/\[BuglyManager\.cpp\]/d' -e '/\[NativeCrashHandler\.cpp\]/d' -e '/\[BuglyService\.cpp\]/d' -e '/\[HotUpdater\]/d' -e '/ERROR:CONSOLE/d'
