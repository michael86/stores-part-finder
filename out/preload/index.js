"use strict";
const electron = require("electron");
if (!process.contextIsolated) {
  throw new Error("contextIsolation must be enabled in the BrowserWindow");
}
try {
  electron.contextBridge.exposeInMainWorld("context", {
    locale: navigator.language,
    getSettings: () => electron.ipcRenderer.invoke("getSettings"),
    setSettingsLocation: () => electron.ipcRenderer.invoke("setSettingsLocation"),
    setSettingsTemplate: (headers) => electron.ipcRenderer.invoke("setSettingsTemplate", headers),
    setSettingsFirstRunComplete: () => electron.ipcRenderer.invoke("setSettingsFirstRunComplete"),
    fetchFileCount: () => electron.ipcRenderer.invoke("fetchFileCount"),
    fetchPartCount: () => electron.ipcRenderer.invoke("fetchPartCount")
  });
} catch (error) {
  console.error(error);
}
