// 核心：动态战术配置中心
// 能够根据当前环境自动切换指挥中心地址 (LAN Support)

const defaultIp = '192.168.2.184'; // 从 server_config.json 获取的默认值

export const CONFIG = {
  API_BASE: `http://${defaultIp}:8000/api`,
  WS_BASE: `ws://${defaultIp}:8000/ws`,
  APP_VERSION: '1.2.5-Stable',
  SYNC_INTERVAL: 5000,
  BRANDING: {
    company: '数智化运营部',
    name: 'Smart-CS Pro',
    subName: '数智化运营治理平台',
    logoText: 'S-CS'
  }
};

// 异步初始化方法，用于在应用启动时同步最新的局域网配置
export const initDynamicConfig = async () => {
  try {
    if (window.api && window.api.getServerConfig) {
      const serverConfig = await window.api.getServerConfig();
      const centralUrl = serverConfig?.network?.central_server_url;
      
      if (centralUrl) {
        CONFIG.API_BASE = centralUrl;
        // 修正：从 http://...:8000/api 转换为 ws://...:8000/ws
        CONFIG.WS_BASE = centralUrl.replace('/api', '/ws').replace('http', 'ws');
        console.log(`🌐 [动态配置] 成功同步指挥中心: ${CONFIG.API_BASE}`);
      } else {
        console.warn('⚠️ [动态配置] server_config.json 中缺少 central_server_url');
      }

      // 同步品牌自定义信息
      if (serverConfig?.branding) {
        CONFIG.BRANDING.company = serverConfig.branding.company_name;
        CONFIG.BRANDING.name = serverConfig.branding.system_name;
        CONFIG.BRANDING.subName = serverConfig.branding.system_sub_name;
        CONFIG.BRANDING.logoText = serverConfig.branding.logo_text;
      }
      
      console.log(`🚀 [战术链路] 已同步配置，当前系统: ${CONFIG.BRANDING.name}`);
    }
  } catch (e) {
    console.warn('⚠️ 无法获取动态配置，将使用默认硬编码地址');
  }
};