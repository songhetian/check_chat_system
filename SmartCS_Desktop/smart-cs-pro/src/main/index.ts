import { app, shell, BrowserWindow, ipcMain, dialog, desktopCapturer } from 'electron'
import { join } from 'path'
// ... 其他保持不变

// 核心：战术截屏接口 (用于实时监控)
ipcMain.handle('capture-screen', async () => {
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 800, height: 450 } })
    if (sources.length > 0) {
      return sources[0].thumbnail.toDataURL()
    }
    return null
  } catch (e) {
    console.error('Screen capture failed', e)
    return null
  }
})
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

function createWindow(): void {
  // 核心：从 .env 加载并覆盖 server_config.json
  const appPath = app.getAppPath()
  const envPath = join(appPath, '.env')
  const configPath = join(appPath, 'server_config.json')
  
  let serverConfig = { 
    network: { 
      central_server_url: '', // 初始置空，由环境解析注入
      local_port: '8000' 
    } 
  }
  
  // 1. 读取基础 JSON
  try {
    if (fs.existsSync(configPath)) {
      const baseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      serverConfig = { ...serverConfig, ...baseConfig }
    }
  } catch (e) { console.error('Base config load failed', e) }

  // 2. 解析 .env 并全量覆盖关键字段
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

      // 动态重构中央指挥部地址
      const defaultHost = serverConfig.network.central_server_url ? 
                         new URL(serverConfig.network.central_server_url).hostname : 
                         '127.0.0.1';
      
      const host = env['DB_HOST'] || defaultHost;
      const port = env['SERVER_PORT'] || '8000';
      
      serverConfig.network.central_server_url = `http://${host}:${port}/api`
      serverConfig.network.local_port = port
      console.log(`🌐 [配置系统] 已加载环境，中枢锁定: ${serverConfig.network.central_server_url}`)
    }
  } catch (e) { console.error('Env override failed', e) }

  // 暴露配置给前端
  ipcMain.handle('get-server-config', () => serverConfig)

  // 核心：战术 API 转发桥
  ipcMain.handle('call-api', async (_, { url, method, data, headers }) => {
    try {
      const finalHeaders: Record<string, string> = { 
        'Content-Type': 'application/json',
        ...(headers || {})
      }

      // 自动修复逻辑：如果提供了 token 但没加 Bearer 前缀，自动补全
      if (finalHeaders['Authorization'] && !finalHeaders['Authorization'].startsWith('Bearer ')) {
        finalHeaders['Authorization'] = `Bearer ${finalHeaders['Authorization']}`
      }

      console.log(`📡 [API 转发] ${method || 'GET'} -> ${url}`)
      
      const response = await fetch(url, {
        method: method || 'GET',
        headers: finalHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(10000)
      })
      
      const result = await response.json()
      return { status: response.status, data: result }
    } catch (e: any) {
      console.error(`❌ [API 转发失败] URL: ${url} | Error: ${e.message}`)
      
      // 区分错误类型
      let errorMsg = "中枢通讯链路断开"
      if (e.name === 'TimeoutError') errorMsg = "战术响应超时"
      else if (e.message.includes('ECONNREFUSED')) errorMsg = "指挥中心处于脱机状态"
      
      return { 
        status: 500, 
        error: errorMsg,
        details: e.message 
      }
    }
  })

  // 核心：创建标准窗口 (初始提升至工业级宽屏尺寸)
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
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

  // 响应前端尺寸变化 (支持坐标定位)
  ipcMain.on('resize-window', (_, { width, height, center, x, y }) => {
    const adjustedWidth = Math.round(process.platform === 'darwin' ? width + 20 : width)
    const adjustedHeight = Math.round(process.platform === 'darwin' ? height + 20 : height)
    
    mainWindow.setSize(adjustedWidth, adjustedHeight, true)
    
    if (center) {
      mainWindow.center()
    } else if (x !== undefined && y !== undefined) {
      mainWindow.setPosition(Math.round(x), Math.round(y), true)
    }
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