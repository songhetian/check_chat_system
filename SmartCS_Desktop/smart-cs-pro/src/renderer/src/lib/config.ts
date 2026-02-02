// 核心：动态战术配置中心 (全小写强制规范化版)
// 能够根据当前环境自动切换指挥中心地址 (LAN Support)

const defaultIp = '127.0.0.1'; 

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
      let centralUrl = serverConfig?.network?.central_server_url;
      
      if (centralUrl) {
        // 关键修复：强制全小写并规范化，防止出现 /API 导致的 404
        centralUrl = centralUrl.trim().toLowerCase();
        if (centralUrl.endsWith('/')) centralUrl = centralUrl.slice(0, -1);
        
        CONFIG.API_BASE = centralUrl;
        CONFIG.WS_BASE = centralUrl.replace('/api', '/ws').replace('http', 'ws');
        console.log(`🌐 [动态配置] 指挥中心已锁定 (全小写强制): ${CONFIG.API_BASE}`);
      }

      // 同步品牌自定义信息
      if (serverConfig?.branding) {
        CONFIG.BRANDING.company = serverConfig.branding.company_name;
        CONFIG.BRANDING.name = serverConfig.branding.system_name;
        CONFIG.BRANDING.subName = serverConfig.branding.system_sub_name;
        CONFIG.BRANDING.logoText = serverConfig.branding.logo_text;
      }
    }
  } catch (e) {
    console.error('❌ [动态配置] 获取失败，请检查配置文件');
  }
};