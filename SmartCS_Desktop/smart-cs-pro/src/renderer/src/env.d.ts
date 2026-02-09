/// <reference types="vite/client" />

interface Window {
  electron: {
    ipcRenderer: {
      send(channel: string, ...args: any[]): void
      on(channel: string, func: (...args: any[]) => void): () => void
      once(channel: string, func: (...args: any[]) => void): void
      invoke(channel: string, ...args: any[]): Promise<any>
    }
  }
  api: {
    getServerConfig: () => Promise<any>,
    getSyncStatus: () => Promise<{ pendingCount: number }>,
    captureScreen: () => Promise<string | null>,
    selectFile: (options: { title?: string, filters?: any[] }) => Promise<{ path: string, name: string, data: string, type: string } | null>,
    secureEncrypt: (text: string) => Promise<string>,
    secureDecrypt: (encrypted: string) => Promise<string>,
    callApi: (payload: { url: string, method?: string, data?: any, headers?: any }) => Promise<{ status: number, data?: any, error?: string }>
  }
}
