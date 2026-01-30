const { app, BrowserWindow, screen, globalShortcut, ipcMain, clipboard, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createFloatingWindow() {
  // ... 之前的窗口创建代码

  // 创建系统托盘
  tray = new Tray(path.join(__dirname, 'assets/logo.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Smart-CS 状态', enabled: false },
    { type: 'separator' },
    { label: '在线', type: 'radio', checked: true, click: () => changeStatus('online') },
    { label: '忙碌', type: 'radio', click: () => changeStatus('busy') },
    { label: '离开', type: 'radio', click: () => changeStatus('away') },
    { type: 'separator' },
    { label: '显示窗口 (Alt+Space)', click: () => mainWindow.show() },
    { label: '退出系统', click: () => app.quit() }
  ]);
  tray.setToolTip('Smart-CS 客服助手');
  tray.setContextMenu(contextMenu);
}

function changeStatus(status) {
  mainWindow.webContents.send('status-changed', status);
  // 通过 IPC 通知前端 Zustand 更新，并由 Socket 同步给服务端
}
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 320,
    height: 60,
    x: width - 340,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false, // 现代安全实践
      contextIsolation: true, // 开启隔离
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 生产环境下加载构建后的文件，开发环境下加载 Vite 地址
  const isDev = process.env.NODE_ENV === 'development';
  mainWindow.loadURL(isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, 'dist/index.html')}`);

  // 实现自动贴边隐藏与失焦淡化
  mainWindow.on('blur', () => {
    // 渐变降低透明度
    let opacity = 1.0;
    const timer = setInterval(() => {
      opacity -= 0.1;
      mainWindow.setOpacity(opacity);
      if (opacity <= 0.3) clearInterval(timer);
    }, 50);
  });

  mainWindow.on('focus', () => {
    mainWindow.setOpacity(1.0);
  });

  // 注册全局快捷键呼出搜索
  globalShortcut.register('Alt+Space', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setOpacity(1.0); // 确保呼出时是不透明的
    mainWindow.webContents.send('focus-search');
  });
}

// 自动粘贴逻辑
ipcMain.on('copy-and-paste', (event, text) => {
  clipboard.writeText(text);
  
  // 先隐藏悬浮窗，让焦点回到之前的聊天窗口
  mainWindow.hide();
  
  // 延迟一小会儿确保焦点切换成功，然后模拟 Ctrl+V
  setTimeout(() => {
    // 使用 robotjs 模拟物理按键
    const robot = require('robotjs');
    robot.keyTap('v', process.platform === 'darwin' ? 'command' : 'control');
    
    // 粘贴完后视情况是否重新显示悬浮窗
    setTimeout(() => {
      mainWindow.show();
    }, 200);
  }, 150);
});

app.whenReady().then(createFloatingWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
