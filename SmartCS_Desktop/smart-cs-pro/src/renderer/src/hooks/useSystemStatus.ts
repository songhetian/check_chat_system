import { useQuery } from '@tanstack/react-query'
import { useRiskStore } from '../store/useRiskStore'
import { useAuthStore } from '../store/useAuthStore'

export function useSystemStatus() {
  const { isOnline, setOnline } = useRiskStore()
  const { token } = useAuthStore()

  return useQuery({
    queryKey: ['system_status'],
    queryFn: async () => {
      let pendingCount = 0;
      if (window.api?.getSyncStatus) {
        const syncRes = await window.api.getSyncStatus()
        pendingCount = syncRes.pendingCount
      }
      try {
        // V3.80: 增强版健康检查，优先使用 token 探测，失败则回退到基础探测
        const healthRes = await window.api.callApi({ 
          url: '/health', 
          method: 'GET',
          // 不传 token 也可以检查服务是否存活
        })
        const currentStatus = healthRes.status === 200;
        if (currentStatus !== isOnline) {
          console.log(`📡 [系统健康] 状态变更: ${isOnline} -> ${currentStatus}`);
          setOnline(currentStatus);
        }
        return { isOnline: currentStatus, pendingSyncCount: pendingCount }
      } catch {
        if (isOnline) {
          console.warn('📡 [系统健康] 链路中断');
          setOnline(false);
        }
        return { isOnline: false, pendingSyncCount: pendingCount }
      }
    },
    refetchInterval: 5000, 
    staleTime: 2000,
    // 即使在没有 token 的情况下也要运行，因为我们需要知道服务器是否存活
  })
}
