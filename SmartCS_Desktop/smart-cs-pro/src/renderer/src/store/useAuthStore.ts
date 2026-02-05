import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ROLE_ID } from '../lib/constants'
import { CONFIG } from '../lib/config'

interface User {
  username: string
  role: 'AGENT' | 'ADMIN' | 'HQ'
  role_id: number
  role_code: string
  real_name: string
  department: string
  permissions: string[] // 细粒度权限集
  rank?: string
  tactical_score?: number
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  logout: () => void
  // 战术校验函数
  hasPermission: (code: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      setUser: (user) => set({ user }),
      logout: () => {
        const token = get().token
        if (token) {
          // 异步通知后端销毁令牌 (不阻塞前端退出)
          window.api.callApi({
            url: `${CONFIG.API_BASE}/auth/logout`,
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => console.warn('🔒 [安全退出] 后端令牌销毁失败，可能已过期'))
        }
        set({ user: null, token: null })
      },
      hasPermission: (code) => {
        const user = get().user
        if (!user) return false
        // 总部 (HQ) 默认拥有全量权限，加速判定
        if (user.role_id === ROLE_ID.HQ || user.role_code === 'HQ') return true
        return user.permissions?.includes(code) || false
      }
    }),
    { name: 'smart-cs-auth' }
  )
)