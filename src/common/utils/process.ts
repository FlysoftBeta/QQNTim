import { app } from "electron";

export const isMainProcess = !!app as boolean;
