import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  username: string
  role: 'AGENT' | 'ADMIN' | 'HQ'
  role_code: string
  real_name: string
  department: string
  permissions: string[] // 细粒度权限集
  rank?: string
  score?: number
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
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
      logout: () => set({ user: null, token: null }),
      hasPermission: (code) => {
        const user = get().user
        if (!user) return false
        // 总部 (HQ) 默认拥有全量权限，加速判定
        if (user.role_code === 'HQ') return true
        return user.permissions?.includes(code) || false
      }
    }),
    { name: 'smart-cs-auth' }
  )
)