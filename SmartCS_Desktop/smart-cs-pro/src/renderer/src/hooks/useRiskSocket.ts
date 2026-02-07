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

    // V3.38: 战术级递归执行器 (代替禁止使用的 setInterval)
    const runLoop = (fn: () => Promise<void> | void, delay: number, timerKey: string) => {
      if (socket?.readyState !== WebSocket.OPEN) return;
      
      const execute = async () => {
        if (socket?.readyState === WebSocket.OPEN) {
          await fn();
          (socket as any)[timerKey] = setTimeout(execute, delay);
        }
      };
      (socket as any)[timerKey] = setTimeout(execute, delay);
    };

    const connect = () => {
      if (!user || !token || !CONFIG.WS_BASE) return;

      const wsUrl = `${CONFIG.WS_BASE}/risk?token=${encodeURIComponent(token)}&username=${encodeURIComponent(user.username)}`;
      socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        console.log('✅ [WS链路] 物理握手成功');
        useRiskStore.getState().setOnline(true)
        retryCount = 0;

        // 1. 画面同步链路 (递归模式)
        if (useAuthStore.getState().user?.role_code === 'AGENT') {
          runLoop(async () => {
            if (window.api?.captureScreen) {
              const imgData = await window.api.captureScreen();
              if (imgData && socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'SCREEN_SYNC', payload: imgData }));
              }
            }
          }, 3000, '_screenTimer');
        }

        // 2. 全局保活心跳 (递归模式)
        runLoop(() => {
          socket?.send(JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() }));
        }, 10000, '_heartbeatTimer');
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'SCREEN_SYNC') {
          window.dispatchEvent(new CustomEvent('ws-screen-sync', { detail: data }));
        }

        if (data.type === 'LIVE_CHAT') {
          window.dispatchEvent(new CustomEvent('ws-live-chat', { detail: data }))
        }

        if (data.type === 'TACTICAL_DEPT_VIOLATION') {
          window.dispatchEvent(new CustomEvent('ws-dept-violation', { detail: data }))
          window.dispatchEvent(new CustomEvent('ws-tactical-command', { detail: data }))
        }

        if (data.type && data.type.startsWith('TACTICAL_')) {
          window.dispatchEvent(new CustomEvent('ws-tactical-command', { detail: data }))
        }

        if (data.type === 'VIOLATION') {
          addViolation(data)
          setAlerting(true)
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

        if (data.type === 'TERMINATE_SESSION') {
          setTimeout(() => {
            useAuthStore.getState().logout();
            window.location.hash = '/login';
          }, 2000);
          return;
        }
      }

      socket.onclose = () => {
        useRiskStore.getState().setOnline(false)
        if ((socket as any)._screenTimer) clearTimeout((socket as any)._screenTimer);
        if ((socket as any)._heartbeatTimer) clearTimeout((socket as any)._heartbeatTimer);
        
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        reconnectTimeout = setTimeout(connect, delay);
        retryCount++;
      }

      socket.onerror = () => {
        socket?.close();
      }
    }

    connect();

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