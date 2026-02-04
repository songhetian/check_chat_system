import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 自定义 API，暴露给渲染进程 (window.api)
const api = {
  getServerConfig: () => ipcRenderer.invoke('get-server-config'),
  // 补全：支持自定义 headers 注入 (用于 Bearer Token)
  callApi: (payload: { url: string, method?: string, data?: any, headers?: any }) => 
    ipcRenderer.invoke('call-api', payload)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}