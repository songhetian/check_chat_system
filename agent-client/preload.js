const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 发送求助信号
  sendHelpRequest: (data) => ipcRenderer.send('help-request', data),
  
  // 监听主管的震屏指令
  onShake: (callback) => ipcRenderer.on('on-shake', callback),
  
  // 监听底层引擎发现的违规行为
  onViolation: (callback) => ipcRenderer.on('violation-detected', callback),
  
  // 复制文字到系统剪切板 (为了更好的性能)
  copyToClipboard: (text) => ipcRenderer.send('copy-to-clipboard', text)
});
