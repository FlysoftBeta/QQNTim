/**
 * @license
 * Copyright (c) Flysoft.
 */

import { patchElectron } from "./patch";
import { collectPlugins, plugins, prepareConfigDir } from "./plugins";
import { setPlugins } from "./loader";

prepareConfigDir();
collectPlugins();
setPlugins(plugins);
patchElectron();
