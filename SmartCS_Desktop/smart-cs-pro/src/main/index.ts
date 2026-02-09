import { app, shell, BrowserWindow, ipcMain, dialog, desktopCapturer, safeStorage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'

// V3.100: 恢复硬件加速以提升 Mac 渲染性能，配合非透明窗口使用是安全的
// app.disableHardwareAcceleration(); // 已注释

// --- 0. 物理引擎进程管理 (V3.25) ---
let pythonProcess: ChildProcess | null = null

function startPythonEngine(): void {
  const engineName = process.platform === 'win32' ? 'SmartCS_Engine.exe' : 'SmartCS_Engine'
  const enginePath = is.dev 
    ? join(app.getAppPath(), 'core_engine', 'engine.py')
    : join(process.resourcesPath, engineName)

  console.log(`🚀 [引擎拉起] 正在尝试激活物理核心: ${enginePath}`)

  // V3.98: 强化版端口排空逻辑
  try {
    const port = 8000
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`], { shell: true })
    } else {
      // 使用更兼容的 shell 方式清理端口
      const killCmd = `lsof -ti:${port} | xargs kill -9`
      try {
        require('child_process').execSync(killCmd)
        console.log(`🧹 [物理排空] 成功清理端口 ${port}`)
      } catch (e) {
        // 忽略端口未被占用的报错
      }
    }
  } catch (e) { console.warn('⚠️ 端口清理跳过') }

  try {
    if (is.dev) {
      // 关键修复：Windows 通常使用 'python' 而非 'python3'
      const cmd = process.platform === 'win32' ? 'python' : 'python3'
      pythonProcess = spawn(cmd, [enginePath], {
        shell: process.platform === 'win32' // Windows 下启用 shell 以正确解析环境变量
      })
    } else if (fs.existsSync(enginePath)) {
      pythonProcess = spawn(enginePath)
    }

    pythonProcess?.stdout?.on('data', (data) => {
      // 关键修复：直接输出原始 Buffer，不经过 toString() 转换，由终端自行解码
      process.stdout.write(Buffer.concat([Buffer.from('[Engine]: '), data]))
    })
    pythonProcess?.stderr?.on('data', (data) => {
      process.stderr.write(Buffer.concat([Buffer.from('[Engine Error]: '), data]))
    })
    
    pythonProcess?.on('close', (code) => {
      console.log(`🔌 [引擎离线] 核心进程已退出，状态码: ${code}`)
    })
  } catch (e) {
    console.error('❌ [引擎启动失败]', e)
  }
}

// 退出时确保杀死引擎
app.on('before-quit', () => {
  if (pythonProcess) {
    console.log('🛑 [系统关闭] 正在同步注销物理核心...')
    pythonProcess.kill()
  }
})

// --- 1. 战术本地数据库管理 (Better-SQLite3) ---
let db: any = null;

function initDatabase(): void {
  try {
    const Database = require('better-sqlite3')
    const dbPath = join(app.getPath('userData'), 'client_tactical_buffer.db')
    db = new Database(dbPath)

    // 初始化本地缓存表
    db.exec(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        data TEXT,
        headers TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS api_cache (
        url TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✅ [SQLite] 战术本地缓冲已激活')
  } catch (e) {
    console.error('❌ [SQLite 初始化失败]', e)
  }
}

// 全局异常熔断保护 (V3.95)
process.on('uncaughtException', (error) => {
  console.error('🚨 [主进程致命异常]:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('🚨 [异步链路熔断]:', reason)
})

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

  // 暴露同步状态给前端
  ipcMain.handle('get-sync-status', async () => {
    if (!db) return { pendingCount: 0 }
    try {
      const row = db.prepare('SELECT COUNT(*) as count FROM offline_queue').get() as { count: number }
      return { pendingCount: row.count }
    } catch (e) {
      return { pendingCount: 0 }
    }
  })

  // 核心：离线暂存逻辑
  const saveToOfflineQueue = (url: string, method: string, data: any, headers: any) => {
    if (!db) return
    try {
      const stmt = db.prepare('INSERT INTO offline_queue (url, method, data, headers) VALUES (?, ?, ?, ?)')
      stmt.run(url, method, JSON.stringify(data), JSON.stringify(headers))
      console.log(`📦 [离线守卫] 数据已存入本地战术缓冲: ${url}`)
    } catch (e) {
      console.error('❌ [离线暂存失败]', e)
    }
  }

  // 核心：战术同步引擎 (网络恢复后自动补发)
  let isSyncing = false
  const syncOfflineData = async () => {
    if (isSyncing || !db) return
    try {
      const records = db.prepare('SELECT * FROM offline_queue ORDER BY id ASC LIMIT 10').all() as any[]
      
      if (records.length === 0) return
      
      isSyncing = true
      console.log(`🔄 [同步引擎] 发现 ${records.length} 条离线数据，尝试同步...`)

      for (const record of records) {
        try {
          const response = await fetch(record.url, {
            method: record.method,
            headers: JSON.parse(record.headers),
            body: record.data,
            signal: AbortSignal.timeout(5000)
          })

          if (response.ok) {
            db.prepare('DELETE FROM offline_queue WHERE id = ?').run(record.id)
            console.log(`✅ [同步成功] 记录 ID: ${record.id}`)
          }
        } catch (e) {
          console.warn(`⚠️ [同步中断] 网络仍不稳定: ${record.url}`)
          break // 退出循环，等待下一次尝试
        }
      }
    } catch (dbErr) {
      console.error('❌ [同步引擎数据库异常]', dbErr)
    } finally {
      isSyncing = false
    }
  }

  // 定时检查心跳并同步 (每 30 秒)
  setInterval(syncOfflineData, 30000)

  // 核心：战术 API 转发桥 (增强版)
  ipcMain.handle('call-api', async (_, { url, method, data, headers }) => {
    try {
      // 自动补全 URL：如果传入的是相对路径，则拼上中央服务器基地址
      const finalUrl = url.startsWith('http') ? url : `${serverConfig.network.central_server_url}${url}`
      
      const finalHeaders: Record<string, string> = { 
        'Content-Type': 'application/json',
        ...(headers || {})
      }

      if (finalHeaders['Authorization'] && !finalHeaders['Authorization'].startsWith('Bearer ')) {
        finalHeaders['Authorization'] = `Bearer ${finalHeaders['Authorization']}`
      }

      // V4.90: 物理缓存击穿 (针对局域网 IP 优化)
      let cacheBustedUrl = finalUrl;
      try {
        const urlObj = new URL(finalUrl);
        urlObj.searchParams.set('_t', Date.now().toString());
        cacheBustedUrl = urlObj.toString();
      } catch (e) {
        console.warn('⚠️ [URL 解析告警] 无法注入时间戳:', finalUrl);
      }

      console.log(`📡 [API 转发] ${method || 'GET'} -> ${cacheBustedUrl}`)
      
      // V3.92: 增加请求体安全序列化
      let body: string | undefined = undefined;
      if (data) {
        try {
          body = JSON.stringify(data);
        } catch (jsonErr) {
          console.error('❌ [API 请求体序列化失败]', jsonErr);
          return { status: 400, error: "无效的请求载荷" };
        }
      }

      const response = await fetch(cacheBustedUrl, {
        method: method || 'GET',
        headers: {
          ...finalHeaders,
          'Connection': 'close' // 禁用长连接，防止局域网链路假死
        },
        body,
        // @ts-ignore - 强制 IPv4 优先，解决某些环境下 IPv6 导致的 fetch failed
        family: 4, 
        signal: AbortSignal.timeout(10000)
      })
      
      let result;
      try {
        const text = await response.text();
        // 如果返回体过大，可能导致解析阶段内存溢出
        if (text.length > 5 * 1024 * 1024) { // 5MB 熔断
           console.warn(`⚠️ [API 响应过大] ${url}: ${Math.round(text.length/1024)}KB`);
           result = { status: 'error', message: "响应数据超出安全阈值" };
        } else {
           result = JSON.parse(text);
        }
      } catch (e) {
        result = { status: response.ok ? 'ok' : 'error' }
      }
      
      // 战术增强：如果是 GET 请求成功，存入读缓存 (排除健康检查)
      if (db && (method === 'GET' || !method) && response.ok && !url.includes('/health')) {
        try {
          const cleanUrl = finalUrl.replace(/[\?&]_t=\d+/, '').replace(/[\?&]t=\d+/, '')
          const cacheData = JSON.stringify(result) || ''
          // V3.82: 增加大容量缓存保护，防止 SQLite 物理溢出导致进程崩溃
          if ((cacheData || '').length < 1024 * 1024) { // 限制 1MB
            const stmt = db.prepare('INSERT OR REPLACE INTO api_cache (url, data) VALUES (?, ?)')
            stmt.run(cleanUrl, cacheData)
          } else {
            console.warn(`⚠️ [读缓存跳过] 数据过大 (${Math.round((cacheData || '').length/1024)}KB): ${url}`)
          }
        } catch (sqliteErr) {
          console.error('❌ [读缓存写入失败]', sqliteErr)
        }
      }

      // 成功后触发一次静默同步 (异步执行，不阻塞当前响应)
      syncOfflineData().catch(e => console.error('Sync failed', e));
      
      // V4.85: 增加鉴权熔断物理信号分发逻辑
      if (response.status === 401 || response.status === 403) {
         console.warn(`🚨 [鉴权熔断] 检测到令牌失效信号: ${finalUrl}`);
         BrowserWindow.getAllWindows().forEach(win => {
           win.webContents.send('api-response-error', { status: response.status, url: finalUrl });
         });
      }

      return { status: response.status, data: result }
    } catch (e: any) {
      // V4.95: 增强型物理链路排障日志
      const errorDetail = {
        message: e.message,
        code: e.code,
        cause: e.cause?.message || e.cause?.code || '未知诱因',
        stack: e.stack?.split('\n')[0]
      };
      console.error(`❌ [API 转发崩溃拦截] URL: ${url} | 详情:`, errorDetail);
      
      try {
        // 离线读缓存逻辑：如果是 GET 请求失败，尝试从缓存返回 (排除健康检查)
        if (db && (method === 'GET' || !method) && !url.includes('/health')) {
          const finalUrl = url.startsWith('http') ? url : `${serverConfig.network.central_server_url}${url}`
          const cleanUrl = finalUrl.replace(/[\?&]_t=\d+/, '').replace(/[\?&]t=\d+/, '')
          const cached = db.prepare('SELECT data FROM api_cache WHERE url = ?').get(cleanUrl) as { data: string } | undefined
          if (cached) {
            console.log(`📦 [离线守卫] 从本地读缓存返回数据: ${url}`)
            return { status: 200, data: JSON.parse(cached.data), _fromCache: true }
          }
        }

        // 离线写队列逻辑：全量拦截策略
        if (method !== 'GET' && method !== 'HEAD') {
          const finalUrl = url.startsWith('http') ? url : `${serverConfig.network.central_server_url}${url}`
          saveToOfflineQueue(finalUrl, method || 'POST', data, headers)
          
          return { 
            status: 200, 
            data: { 
              status: 'ok', 
              message: "数据已记录至离线缓冲，连接恢复后自动同步",
              _isOffline: true 
            }
          }
        }
      } catch (offlineErr) {
        console.error('❌ [离线逻辑次生故障]', offlineErr);
      }

      let errorMsg = "中枢通讯链路断开"
      if (e.name === 'TimeoutError') errorMsg = "战术响应超时"
      else if (e.message.includes('ECONNREFUSED')) errorMsg = "指挥中心处于脱机状态"
      
      return { status: 500, error: errorMsg }
    }
  })

  // 核心：战术截屏接口 (V3.21 极致清晰版)
  ipcMain.handle('capture-screen', async () => {
    try {
      const { screen } = require('electron')
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width, height } = primaryDisplay.bounds // 使用 bounds 获取更准确的逻辑尺寸
      const scaleFactor = primaryDisplay.scaleFactor || 1
      
      const sources = await desktopCapturer.getSources({ 
        types: ['screen'], 
        thumbnailSize: { 
          width: Math.round(width * scaleFactor), 
          height: Math.round(height * scaleFactor) 
        } // 物理 1:1 采样 (考虑 DPI)
      })
      
      if (sources.length > 0) {
        // 关键：切换至 PNG 无损格式，彻底解决 Windows 1080p 在 Mac 上的文字模糊问题
        const image = sources[0].thumbnail.toPNG()
        return `data:image/png;base64,${image.toString('base64')}`
      }
      return null
    } catch (e) {
      console.error('Screen capture failed', e)
      return null
    }
  })

  // 核心：创建标准窗口 (初始提升至工业级宽屏尺寸)
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    show: false,
    frame: false, // 恢复无边框
    transparent: true, // 恢复透明
    alwaysOnTop: false,
    autoHideMenuBar: true,
    backgroundColor: '#00000000', // 恢复透明底色
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

  // V4.15: 物理文件选择器
  ipcMain.handle('select-file', async (_, options: { title?: string, filters?: any[] }) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: options.title || '选择战术附件',
      properties: ['openFile'],
      filters: options.filters || [{ name: '所有文件', extensions: ['*'] }]
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      // 读取文件为 Buffer (以便前端上传)
      const filePath = result.filePaths[0]
      const fileName = filePath.split(/[\\\/]/).pop()
      const fileData = fs.readFileSync(filePath)
      return { 
        path: filePath, 
        name: fileName, 
        data: fileData.toString('base64'),
        type: fileName?.split('.').pop()
      }
    }
    return null
  })

  // V5.10: 物理级安全存储接口 (利用系统钥匙串加密)
  ipcMain.handle('secure-encrypt', (_, text: string) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) return text;
      return safeStorage.encryptString(text).toString('base64');
    } catch (e) { return text; }
  });

  ipcMain.handle('secure-decrypt', (_, encryptedBase64: string) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) return encryptedBase64;
      const buffer = Buffer.from(encryptedBase64, 'base64');
      return safeStorage.decryptString(buffer);
    } catch (e) { return ''; }
  });

  // 窗口控制逻辑
  ipcMain.on('minimize-window', () => mainWindow?.minimize())
  ipcMain.on('close-window', () => mainWindow?.close())
  
  // V5.25: 增强型最大化/还原控制
  ipcMain.on('toggle-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  // 监听原生窗口事件并物理同步至前端
  mainWindow?.on('maximize', () => mainWindow?.webContents.send('window-state-change', 'maximized'))
  mainWindow?.on('unmaximize', () => mainWindow?.webContents.send('window-state-change', 'normal'))

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

  // V3.30: 物理干预指令 - 模拟删除输入
  ipcMain.on('clear-input', () => {
    if (process.platform === 'win32') {
      const { keyboard, Key } = require('@nut-tree/nut-js')
      // 战术连招：Ctrl+A -> Backspace
      keyboard.config.autoDelayMs = 0
      keyboard.pressKey(Key.LeftControl, Key.A)
      keyboard.releaseKey(Key.LeftControl, Key.A)
      keyboard.type(Key.Backspace)
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

  // 1. 初始化本地数据库
  initDatabase()

  // 2. 激活物理引擎
  startPythonEngine()
  
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
