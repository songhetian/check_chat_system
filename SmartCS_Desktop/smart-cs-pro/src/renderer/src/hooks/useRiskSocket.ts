import { useEffect } from 'react'
import { useRiskStore } from '../store/useRiskStore'
import { useToast } from '../components/ui/use-toast' // 假设已安装 shadcn toast

export const useRiskSocket = () => {
  const addViolation = useRiskStore((s) => s.addViolation)
  const setAlerting = useRiskStore((s) => s.setAlerting)

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/risk')

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'VIOLATION') {
        addViolation(data)
        setAlerting(true)
        setTimeout(() => setAlerting(false), 5000)
      }

      if (data.type === 'RED_ALERT') {
        addViolation(data)
        window.dispatchEvent(new CustomEvent('trigger-red-alert'))
      }

      if (data.type === 'PRAISE') {
        // 触发全局烟花 (可以使用自定义事件或 Zustand)
        window.dispatchEvent(new CustomEvent('trigger-fireworks'))
      }

      if (data.type === 'SOP_GUIDE') {
        // 触发 SOP 侧边滑出
        window.dispatchEvent(new CustomEvent('trigger-sop', { detail: data.steps }))
      }

      if (data.type === 'PRODUCT_SUGGESTION') {
        window.dispatchEvent(new CustomEvent('trigger-suggestion', { detail: data.products }))
      }
    }

    socket.onerror = () => console.error('WebSocket 链路故障')
    
    return () => socket.close()
  }, [])
}
