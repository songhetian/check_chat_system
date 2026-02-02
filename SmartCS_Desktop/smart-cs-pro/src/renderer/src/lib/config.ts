// 核心：动态战术配置中心
// 能够根据当前环境自动切换指挥中心地址 (LAN Support)

const defaultIp = '192.168.2.184'; // 从 server_config.json 获取的默认值

export const CONFIG = {
  API_BASE: `http://${defaultIp}:8000/api`,
  WS_BASE: `ws://${defaultIp}:8000/ws`,
  APP_VERSION: '1.2.5-Stable',
  SYNC_INTERVAL: 5000
};

// 异步初始化方法，用于在应用启动时同步最新的局域网配置
export const initDynamicConfig = async () => {
  try {
    if (window.api && window.api.getServerConfig) {
      const serverConfig = await window.api.getServerConfig();
      const centralUrl = serverConfig?.network?.central_server_url;
      
      if (centralUrl) {
        CONFIG.API_BASE = centralUrl;
        CONFIG.WS_BASE = centralUrl.replace('http', 'ws');
        console.log(`🚀 [战术链路] 已同步指挥中心地址: ${CONFIG.API_BASE}`);
      }
    }
  } catch (e) {
    console.warn('⚠️ 无法获取动态配置，将使用默认硬编码地址');
  }
};