const { ipcRenderer } = require('electron/renderer')
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld("depwnerStatus", {
    getThreats: () => ipcRenderer.invoke("getThreats"),
    getStats: () => ipcRenderer.invoke("getStats")
})

contextBridge.exposeInMainWorld("depwnerPreferences", {
    get: () => ipcRenderer.invoke("getSettings"),
    set: (newSettings) => ipcRenderer.send("setSettings", newSettings),
})

contextBridge.exposeInMainWorld("electronFilesystem", {
    getFile: () => ipcRenderer.invoke("selectFile"),
    getFolder: () => ipcRenderer.invoke("selectFolder"),
    manualScan: (path, type) => ipcRenderer.send("startManualScan", path, type),
    onScanStatus: (callback) => ipcRenderer.on("scanStatus", (event, status) => callback(status))
})
