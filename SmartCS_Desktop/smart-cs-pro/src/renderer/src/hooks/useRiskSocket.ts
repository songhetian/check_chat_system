import { useEffect } from 'react'
import { useRiskStore } from '../store/useRiskStore'
import { useToast } from '../components/ui/use-toast' // 假设已安装 shadcn toast

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
      // 在场景 B 中，这里应该是服务器的局域网真实 IP
      // 实际生产中可以通过 Electron 的 IPC 传进来，或者读取配置文件
      const serverIp = '127.0.0.1'; // 演示先用本机，部署时改为服务器 IP
      socket = new WebSocket(`ws://${serverIp}:8000/ws/risk?token=mock-token-123`)

      socket.onopen = () => {
        console.log('✅ 战术链路已建立')
        retryCount = 0;
        useRiskStore.getState().setOnline(true)
        setSendMessage((msg: any) => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(msg))
          }
        })
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'AI_ULTRA_ANALYSIS') {
          useRiskStore.getState().setAiAnalysis(data.data)
        }

        if (data.type === 'VIOLATION') {
          addViolation(data)
          setAlerting(true)
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
