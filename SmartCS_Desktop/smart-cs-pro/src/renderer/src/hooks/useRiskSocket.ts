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

      // 核心：建立物理连接
      socket = new WebSocket(`${CONFIG.WS_BASE}/risk?token=${token}&username=${user.username}`)

      socket.onopen = () => {
        console.log('✅ [WS链路] 物理握手成功');
        useRiskStore.getState().setOnline(true)
        retryCount = 0;
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
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
          window.dispatchEvent(new CustomEvent('trigger-violation-alert', { 
            detail: { id: data.id, agent: data.agent || data.real_name, keyword: data.keyword } 
          }))
          setTimeout(() => setAlerting(false), 5000)
        }

        if (data.type === 'TACTICAL_LOCK') {
           window.dispatchEvent(new CustomEvent('trigger-toast', { 
             detail: { title: '指令到达', message: '已执行指挥官下发的[输入锁定]动作', type: 'error' } 
           }))
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
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          reconnectTimeout = setTimeout(connect, delay);
          retryCount++;
        }
      }

      socket.onerror = () => {
        socket?.close();
      }
    }

    connect();
    
    return () => {
      socket?.close();
      clearTimeout(reconnectTimeout);
    }
  }, [user, token])
}