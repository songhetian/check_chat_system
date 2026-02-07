import { useEffect } from 'react'
import { useRiskStore } from '../store/useRiskStore'
import { useAuthStore } from '../store/useAuthStore'
import { CONFIG } from '../lib/config'

export const useRiskSocket = () => {
  const { user, token } = useAuthStore()
  const addViolation = useRiskStore((s) => s.addViolation)
  const setAlerting = useRiskStore((s) => s.setAlerting)

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 10;

    const connect = () => {
      if (!user || !token || !CONFIG.WS_BASE) {
        return;
      }

      // 核心：建立物理连接，对参数进行编码以防止特殊字符干扰
      const wsUrl = `${CONFIG.WS_BASE}/risk?token=${encodeURIComponent(token)}&username=${encodeURIComponent(user.username)}`;
      console.log(`📡 [WS链路] 正在尝试建立战术握手: ${wsUrl}`);
      
      socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        console.log('✅ [WS链路] 物理握手成功，节点已激活');
        useRiskStore.getState().setOnline(true)
        retryCount = 0;

        // 核心：启动画面同步链路
        const screenInterval = setInterval(async () => {
          if (socket?.readyState === WebSocket.OPEN && window.api?.captureScreen) {
            const imgData = await window.api.captureScreen();
            if (imgData) {
              socket.send(JSON.stringify({
                type: 'SCREEN_SYNC',
                payload: imgData
              }));
            }
          }
        }, 3000); // 3秒/帧，平衡性能与实时性

        // 存入清理逻辑
        (socket as any)._screenTimer = screenInterval;
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        // 0. 画面同步转发
        if (data.type === 'SCREEN_SYNC') {
          window.dispatchEvent(new CustomEvent('ws-screen-sync', { detail: data }));
        }

        if (data.type === 'EMERGENCY_HELP') {
          window.dispatchEvent(new CustomEvent('ws-emergency-help', { detail: data }));
        }

        if (data.type === 'REWARD') {
          window.dispatchEvent(new CustomEvent('trigger-toast', { 
            detail: { title: '战术奖励', message: `恭喜！获得 [${data.title}] 奖励 +${data.value} PT`, type: 'success' } 
          }))
          window.dispatchEvent(new CustomEvent('ws-reward-received', { detail: data }));
        }

        // 1. 全局语音闭环
        if (data.voice_alert) {
          const utter = new SpeechSynthesisUtterance(data.voice_alert);
          utter.lang = 'zh-CN'; utter.rate = 0.9;
          window.speechSynthesis.speak(utter);
        }

        // 2. 消息分发逻辑
        if (data.type === 'LIVE_CHAT') {
          // 转发给指挥台监听器
          window.dispatchEvent(new CustomEvent('ws-live-chat', { detail: data }))
        }

        if (data.type === 'VIOLATION') {
          addViolation(data)
          setAlerting(true)
          
          // 核心增强：如果是高危违规，立即触发本地“熔断”提示
          if (data.risk_level >= 4) {
             window.dispatchEvent(new CustomEvent('trigger-toast', { 
               detail: { title: '违规拦截', message: `检测到敏感词 [${data.keyword}]，已执行物理阻断！`, type: 'error' } 
             }))
          }

          window.dispatchEvent(new CustomEvent('trigger-violation-alert', { 
            detail: { id: data.id, agent: data.agent || data.real_name, keyword: data.keyword } 
          }))
          setTimeout(() => setAlerting(false), 5000)
        }

        if (data.type === 'TACTICAL_LOCK') {
           const isCurrentlyLocked = useRiskStore.getState().isLocked;
           const nextState = !isCurrentlyLocked;
           useRiskStore.getState().setIsLocked(nextState);
           
           // V3.24: 物理系统级锁定指令下发 (通知本地 Python 引擎)
           // 关键：强制发往引擎默认端口 8000
           const localApiBase = `http://localhost:8000/api`;

           window.api.callApi({
             url: `${localApiBase}/system/lock`,
             method: 'POST',
             data: { lock: nextState }
           }).catch(e => console.error('Physical lock failed', e));

           // V3.27: 优化交互体验 - 仅在锁定(全屏状态)时显示通知
           if (nextState) {
             window.dispatchEvent(new CustomEvent('trigger-toast', { 
               detail: { 
                 title: '系统已锁定', 
                 message: '已执行指挥官下发的[系统物理锁定]动作，键盘鼠标已禁用', 
                 type: 'error' 
               } 
             }))
           }
        }

        if (data.type === 'TERMINATE_SESSION') {
          window.dispatchEvent(new CustomEvent('trigger-toast', { 
            detail: { title: '会话冲突', message: data.message, type: 'error' } 
          }))
          setTimeout(() => {
            useAuthStore.getState().logout();
            window.location.hash = '/login';
          }, 2000);
          return;
        }

        if (data.type === 'ROLE_CHANGED') {
          const userState = useAuthStore.getState().user;
          if (data.target_user === userState?.username) {
            window.dispatchEvent(new CustomEvent('trigger-toast', { 
              detail: { title: '权限变更', message: data.message, type: 'error' } 
            }))
            setTimeout(() => {
              useAuthStore.getState().logout();
              window.location.hash = '/login';
            }, 3000);
          }
        }
      }

      socket.onclose = () => {
        useRiskStore.getState().setOnline(false)
        if ((socket as any)._screenTimer) clearInterval((socket as any)._screenTimer);
        
        // V3.26: 战术级无限重连逻辑
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.warn(`🔌 [WS链路] 物理连接断开，${delay/1000}s 后进行第 ${retryCount + 1} 次尝试...`);
        reconnectTimeout = setTimeout(connect, delay);
        retryCount++;
      }

      socket.onerror = () => {
        socket?.close();
      }
    }

    connect();

    // 核心：监听外部发送指令请求
    const handleSendMsg = (e: any) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(e.detail));
      }
    }
    window.addEventListener('send-risk-msg', handleSendMsg);
    
    return () => {
      socket?.close();
      clearTimeout(reconnectTimeout);
      window.removeEventListener('send-risk-msg', handleSendMsg);
    }
  }, [user, token])
}