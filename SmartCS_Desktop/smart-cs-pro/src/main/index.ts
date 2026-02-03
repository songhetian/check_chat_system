import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

function createWindow(): void {
  // 核心：从 .env 加载并覆盖 server_config.json
  const appPath = app.getAppPath()
  const envPath = join(appPath, '.env')
  const configPath = join(appPath, 'server_config.json')
  
  let serverConfig = { network: { central_server_url: 'http://127.0.0.1:8000/api' } }
  
  // 1. 读取基础 JSON
  try {
    if (fs.existsSync(configPath)) {
      serverConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }
  } catch (e) { console.error('Base config load failed', e) }

  // 2. 解析 .env 并覆盖关键字段 (局域网支持)
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      const env: Record<string, string> = {}
      envContent.split(/\r?\n/).forEach(line => {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine.startsWith('#')) return
        const firstEquals = trimmedLine.indexOf('=')
        if (firstEquals === -1) return
        const key = trimmedLine.slice(0, firstEquals).trim()
        const value = trimmedLine.slice(firstEquals + 1).split('#')[0].trim()
        env[key] = value
      })

      const host = env['DB_HOST'] || '127.0.0.1'
      const port = env['SERVER_PORT'] || '8000'
      
      // 动态重构中央指挥部地址
      serverConfig.network.central_server_url = `http://${host}:${port}/api`
      console.log(`🌐 [配置系统] 已加载环境: ${envPath}`)
      console.log(`🌐 [配置系统] 指挥中心定向为: ${serverConfig.network.central_server_url}`)
    } else {
      console.warn(`⚠️ [配置系统] 未找到 .env 文件: ${envPath}`)
    }
  } catch (e) { console.error('Env override failed', e) }

  // 暴露配置给前端
  ipcMain.handle('get-server-config', () => serverConfig)

  // 核心：战术 API 转发桥 (解决局域网 CORS/Network Error 的终极方案)
  ipcMain.handle('call-api', async (_, { url, method, data }) => {
    try {
      // 在 Node.js 环境下发起请求，不经过浏览器沙箱
      const response = await fetch(url, {
        method: method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      })
      const result = await response.json()
      return { status: response.status, data: result }
    } catch (e: any) {
      return { status: 500, error: e.message }
    }
  })

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
      nodeIntegration: false,
      webSecurity: false, // 允许跨域
      allowRunningInsecureContent: true // 允许在 HTTPS 页面中运行 HTTP 内容
    }
  })

  // 窗口控制逻辑
  ipcMain.on('minimize-window', () => mainWindow.minimize())
  ipcMain.on('close-window', () => mainWindow.close())
  
  // 动态置顶逻辑
  ipcMain.on('set-always-on-top', (_, flag: boolean) => {
    mainWindow.setAlwaysOnTop(flag, 'screen-saver') // 使用 screen-saver 等级确保在 Mac 上真正置顶
  })

  ipcMain.on('set-fullscreen', (_, flag: boolean) => {
    mainWindow.setFullScreen(flag)
  })

  // 响应前端尺寸变化
  ipcMain.on('resize-window', (_, { width, height, center }) => {
    // 增加 macOS 阴影缓冲
    const adjustedWidth = process.platform === 'darwin' ? width + 20 : width
    const adjustedHeight = process.platform === 'darwin' ? height + 20 : height
    
    mainWindow.setSize(adjustedWidth, adjustedHeight, true)
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