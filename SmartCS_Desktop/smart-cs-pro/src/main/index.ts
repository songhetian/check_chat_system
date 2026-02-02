import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

function createWindow(): void {
  // 读取局域网配置
  const configPath = join(app.getAppPath(), 'server_config.json')
  let serverConfig = { network: { central_server_url: 'http://127.0.0.1:8000/api' } }
  
  try {
    if (fs.existsSync(configPath)) {
      serverConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load server_config.json', e)
  }

  // 暴露配置给前端
  ipcMain.handle('get-server-config', () => serverConfig)

  // 核心：创建独立、透明、置顶的战术岛窗口
  const mainWindow = new BrowserWindow({
    width: 260,
    height: 52,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    backgroundColor: '#00000000', // 确保 macOS 下透明背景不会闪烁
    hasShadow: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 窗口控制逻辑
  ipcMain.on('minimize-window', () => mainWindow.minimize())
  ipcMain.on('close-window', () => mainWindow.close())

  // 响应前端尺寸变化
  ipcMain.on('resize-window', (_, { width, height, center }) => {
    mainWindow.setSize(width, height, true)
    if (center) mainWindow.center()
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