import { Environment, loadConfig } from "./main/config";
import { app, ipcRenderer } from "electron";

const isMainProcess = !!app;
export const env: Environment = isMainProcess
    ? loadConfig()
    : ipcRenderer.sendSync("___!get_env", {
          eventName: "QQNTIM_GET_ENV",
      });
