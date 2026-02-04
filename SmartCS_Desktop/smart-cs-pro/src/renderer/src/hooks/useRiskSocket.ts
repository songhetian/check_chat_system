import { useEffect } from 'react'
import { useRiskStore } from '../store/useRiskStore'
import { useAuthStore } from '../store/useAuthStore'
import { CONFIG } from '../lib/config'

export const useRiskSocket = () => {
  const addViolation = useRiskStore((s) => s.addViolation)
  const setAlerting = useRiskStore((s) => s.setAlerting)
  const setSendMessage = useRiskStore((s) => s.setSendMessage)

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 10;

    const connect = () => {
      const state = useAuthStore.getState();
      const currentUser = state.user;
      const currentToken = state.token;
      
      if (!currentUser || !currentToken || !CONFIG.WS_BASE) {
        console.warn('📡 [WS待命] 缺少必要凭证或基准地址');
        return;
      }

      console.log(`📡 [WS握手] 正在连接: ${CONFIG.WS_BASE}/risk`);
      
      // 核心：注入物理令牌与身份载荷
      socket = new WebSocket(`${CONFIG.WS_BASE}/risk?token=${currentToken}&username=${currentUser.username}`)

      socket.onopen = () => {
        console.log('✅ [WS链路] 物理握手成功');
        useRiskStore.getState().setOnline(true)
        retryCount = 0;
      }
        const data = JSON.parse(event.data)
        
        // 1. 全局语音闭环：只要有 voice_alert 就播报
        if (data.voice_alert) {
          const utter = new SpeechSynthesisUtterance(data.voice_alert);
          utter.lang = 'zh-CN'; utter.rate = 0.9;
          window.speechSynthesis.speak(utter);
        }

        // 2. 消息分发逻辑
        if (data.type === 'AI_ULTRA_ANALYSIS') {
          useRiskStore.getState().setAiAnalysis(data.data)
        }
        
        if (data.type === 'VIOLATION') {
          addViolation(data)
          setAlerting(true)
          // 触发主管级实时拦截提示
          window.dispatchEvent(new CustomEvent('trigger-violation-alert', { 
            detail: { 
              id: data.id, 
              agent: data.agent || data.real_name, 
              keyword: data.keyword 
            } 
          }))
          setTimeout(() => setAlerting(false), 5000)
        }

        if (data.type === 'MUTE_CONFIRM') {
           window.dispatchEvent(new CustomEvent('trigger-toast', { 
             detail: { title: '战术拦截', message: '坐席已进入静音保护模式', type: 'success' } 
           }))
        }
        if (data.type === 'RED_ALERT') {
          addViolation(data)
          window.dispatchEvent(new CustomEvent('trigger-red-alert'))
        }
        if (data.type === 'PRAISE') {
          window.dispatchEvent(new CustomEvent('trigger-fireworks'))
        }
        if (data.type === 'SOP_GUIDE') {
          window.dispatchEvent(new CustomEvent('trigger-sop', { detail: data.steps }))
        }
        if (data.type === 'PRODUCT_SUGGESTION') {
          window.dispatchEvent(new CustomEvent('trigger-suggestion', { detail: data.products }))
        }

        if (data.type === 'SUPERVISOR_COMMAND') {
          window.dispatchEvent(new CustomEvent('trigger-command', { detail: data }))
        }

        if (data.type === 'GROWTH_MILESTONE') {
          window.dispatchEvent(new CustomEvent('trigger-milestone', { detail: data }))
        }

        if (data.type === 'PERMISSION_CHANGED') {
          const currentUser = useAuthStore.getState().user;
          if (data.target_role === currentUser?.role_code) {
            window.dispatchEvent(new CustomEvent('trigger-permission-toast', { detail: data }))
          }
        }

        if (data.type === 'REWARD_NOTIFY') {
          window.dispatchEvent(new CustomEvent('trigger-reward', { detail: data }))
        }

        if (data.type === 'ROLE_CHANGED') {
          const currentUser = useAuthStore.getState().user;
          if (data.target_user === currentUser?.username) {
            window.dispatchEvent(new CustomEvent('trigger-toast', { 
              detail: { title: '权限变更', message: data.message, type: 'error' } 
            }))
            // 3秒后强制重载系统
            setTimeout(() => {
              useAuthStore.getState().logout();
              window.location.hash = '/login';
            }, 3000);
          }
        }
      }

      socket.onclose = () => {
        console.warn('⚠️ 战术链路断开')
        useRiskStore.getState().setOnline(false)
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          console.log(`正在尝试重连... (${retryCount + 1}/${maxRetries}) 延迟: ${delay}ms`)
          reconnectTimeout = setTimeout(connect, delay);
          retryCount++;
        }
      }

      socket.onerror = (err) => {
        console.error('❌ WebSocket 链路故障', err)
        socket?.close();
      }
    }

    connect();
    
    return () => {
      socket?.close();
      clearTimeout(reconnectTimeout);
    }
  }, [])
}
