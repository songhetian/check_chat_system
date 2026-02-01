import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// ... (省略中间代码)

// 监听从悬浮岛点击“打开大屏”
ipcMain.on('open-big-screen', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.setSize(1280, 850, true)
    win.setResizable(true)
    win.setAlwaysOnTop(false)
    win.center()
  }
})

// 监听文件选择请求
ipcMain.handle('select-video-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mov', 'avi', 'wmv', 'mp4'] }]
  })
  return result.filePaths[0]
})

app.whenReady().then(() => {
  electronApp.setAppId('com.smartcs.pro')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow() // 默认先启动登录窗口形态

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
