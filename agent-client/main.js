const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let mainWindow;

function createFloatingWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 320,
    height: 60,
    x: width - 340, // 初始位置：右下角
    y: 100,         // 顶部留出一点距离
    frame: false,   // 无边框
    transparent: true, // 透明背景
    alwaysOnTop: true, // 始终置顶
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // 实现自动贴边隐藏的逻辑预留
  mainWindow.on('blur', () => {
    // 可以在此处实现失焦后变半透明
    mainWindow.setOpacity(0.5);
  });

  mainWindow.on('focus', () => {
    mainWindow.setOpacity(1.0);
  });
}

app.whenReady().then(createFloatingWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
