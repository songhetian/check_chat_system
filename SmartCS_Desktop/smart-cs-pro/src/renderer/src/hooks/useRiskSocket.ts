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

        runLoop(() => {
          socket?.send(JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() }));
        }, 10000, '_heartbeatTimer');
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        // 1. 基础链路转发
        if (data.type === 'SCREEN_SYNC') window.dispatchEvent(new CustomEvent('ws-screen-sync', { detail: data }));
        if (data.type === 'LIVE_CHAT') window.dispatchEvent(new CustomEvent('ws-live-chat', { detail: data }));

        // 2. 战术指令核心 (V3.42: 修复锁定失效)
        if (data.type === 'TACTICAL_DEPT_VIOLATION') {
          window.dispatchEvent(new CustomEvent('ws-dept-violation', { detail: data }))
        }

        if (data.type === 'TACTICAL_LOCK') {
           const isCurrentlyLocked = useRiskStore.getState().isLocked;
           const nextState = !isCurrentlyLocked;
           useRiskStore.getState().setIsLocked(nextState);
           // 触发物理封锁
           window.api.callApi({
             url: `http://localhost:8000/api/system/lock`,
             method: 'POST',
             data: { lock: nextState }
           }).catch(e => console.error('Physical lock failed', e));
        }

        // 统一指令分发给 UI (包括 PUSH, LOCK, VIOLATION 等)
        if (data.type && data.type.startsWith('TACTICAL_')) {
          window.dispatchEvent(new CustomEvent('ws-tactical-command', { detail: data }))
        }

        // 3. 违规行为处理
        if (data.type === 'VIOLATION') {
          addViolation(data); setAlerting(true);
          window.dispatchEvent(new CustomEvent('trigger-violation-alert', { detail: { id: data.id, agent: data.agent || data.real_name, keyword: data.keyword } }));
          setTimeout(() => setAlerting(false), 5000);
        }

        if (data.type === 'TERMINATE_SESSION') {
          setTimeout(() => { useAuthStore.getState().logout(); window.location.hash = '/login'; }, 2000);
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
      socket.onerror = () => socket?.close();
    }

    connect();

    // V3.74: HTTP 链路熔断监听 (来自主进程转发失败信号)
    const handleLinkBreak = () => {
      if (useRiskStore.getState().isOnline) {
        console.warn('⚡ [链路熔断] HTTP 转发失败，强制进入脱机模式');
        useRiskStore.getState().setOnline(false);
      }
    };
    
    // 使用 electron-toolkit 暴露的 ipcRenderer
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('TACTICAL_LINK_BREAK', handleLinkBreak);
    }

    const handleSendMsg = (e: any) => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(e.detail)); }
    window.addEventListener('send-risk-msg', handleSendMsg);
    
    return () => { 
      socket?.close(); 
      clearTimeout(reconnectTimeout); 
      window.removeEventListener('send-risk-msg', handleSendMsg);
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeAllListeners('TACTICAL_LINK_BREAK');
      }
    }
  }, [user, token])
}