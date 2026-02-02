import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // 核心：创建独立、透明、置顶的战术岛窗口
  const mainWindow = new BrowserWindow({
    width: 240,
    height: 48,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: false, // 修改：默认不再置顶，避免遮挡其他应用
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 窗口控制逻辑
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize()
  })

  ipcMain.on('close-window', () => {
    mainWindow.close()
  })

  // 响应前端尺寸变化
  ipcMain.on('resize-window', (_, { width, height }) => {
    mainWindow.setSize(width, height, true)
  })

  // 切换至大屏模式逻辑
  ipcMain.on('open-big-screen', () => {
    mainWindow.setSize(1280, 850, true)
    mainWindow.center()
    mainWindow.setResizable(true)
    mainWindow.setAlwaysOnTop(false)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.smartcs.pro')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})