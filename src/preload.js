const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    once: (channel, listener) => ipcRenderer.once(channel, listener),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
  }
});
