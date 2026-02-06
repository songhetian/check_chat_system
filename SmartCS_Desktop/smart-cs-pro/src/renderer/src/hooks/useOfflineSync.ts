import { useState, useEffect } from 'react'

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    let isUnmounted = false

    const checkStatus = async () => {
      if (!window.api?.getSyncStatus) return

      try {
        const { pendingCount: count } = await window.api.getSyncStatus()
        const health = await window.api.callApi({ url: '/health' })
        
        if (!isUnmounted) {
          setPendingCount(count)
          setIsOnline(health.status === 200)
        }
      } catch {
        if (!isUnmounted) {
          setIsOnline(false)
        }
      }
    }

    checkStatus()
    const timer = setInterval(checkStatus, 5000)

    return () => {
      isUnmounted = true
      clearInterval(timer) // ✅ 确保销毁
    }
  }, [])

  return { pendingCount, isOnline }
}
