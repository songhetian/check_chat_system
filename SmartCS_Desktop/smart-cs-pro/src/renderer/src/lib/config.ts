// 核心：动态战术配置中心 (局域网专用版)
// 严禁硬编码 127.0.0.1，所有地址均从主进程环境注入

export const CONFIG = {
  // 初始值设为占位符，渲染前必须被 initDynamicConfig 覆盖
  API_BASE: '',
  WS_BASE: '',
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
        // 关键修复：强制全小写规范化
        centralUrl = centralUrl.trim().toLowerCase();
        if (centralUrl.endsWith('/')) centralUrl = centralUrl.slice(0, -1);
        
        CONFIG.API_BASE = centralUrl;
        
        // 智能协议转换：使用 URL 对象安全重构
        const wsUrl = new URL(centralUrl);
        wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        // 保持 /api 路径并追加 /ws
        CONFIG.WS_BASE = wsUrl.toString() + '/ws';
        
        console.log(`🌐 [战术同步] 链路已锁定指挥中心: ${CONFIG.API_BASE}`);
        console.log(`📡 [WS 同步] 实时链路地址: ${CONFIG.WS_BASE}`);
      }
    } else {
      // --- Web 模式适配 ---
      const webOrigin = window.location.origin;
      CONFIG.API_BASE = `${webOrigin}/api`;
      
      const wsUrl = new URL(webOrigin);
      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      CONFIG.WS_BASE = wsUrl.origin + '/api/ws';
      
      console.log(`🌐 [Web模式] 链路已对齐当前服务器: ${CONFIG.API_BASE}`);
    }

    // 同步品牌自定义信息 (Web 模式下尝试从 API 获取)
    // ...
  } catch (e) {
    console.error('❌ [战术同步] 配置文件加载失败，请检查 .env');
  }
};
