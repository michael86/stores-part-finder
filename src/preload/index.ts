import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

try {
  contextBridge.exposeInMainWorld('context', {
    locale: navigator.language,
    getSettings: () => ipcRenderer.invoke('getSettings'),
    setSettingsLocation: () => ipcRenderer.invoke('setSettingsLocation'),
    setSettingsTemplate: (headers) => ipcRenderer.invoke('setSettingsTemplate', headers),
    setSettingsFirstRunComplete: () => ipcRenderer.invoke('setSettingsFirstRunComplete'),
    fetchFileCount: () => ipcRenderer.invoke('fetchFileCount'),
    fetchPartCount: () => ipcRenderer.invoke('fetchPartCount')
  })
} catch (error) {
  console.error(error)
}
