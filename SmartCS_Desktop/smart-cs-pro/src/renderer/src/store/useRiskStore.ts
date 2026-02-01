import { create } from 'zustand'

interface Violation {
  id: string
  agent: string
  keyword: string
  context: string
  timestamp: number
  screenshot?: string
  reason?: string // 新增大模型识别原因
}

interface RiskState {
  isAlerting: boolean
  isRedAlert: boolean // 新增 315 全屏警报状态
  lastViolation: Violation | null
  violations: Violation[]
  addViolation: (v: Violation) => void
  setAlerting: (alert: boolean) => void
  setRedAlert: (alert: boolean) => void
  clearAlerts: () => void
}

export const useRiskStore = create<RiskState>((set) => ({
  isAlerting: false,
  isRedAlert: false,
  lastViolation: null,
  violations: [],
  addViolation: (v) => set((state) => ({
    violations: [v, ...state.violations].slice(0, 100),
    lastViolation: v,
    isAlerting: true
  })),
  setAlerting: (alert) => set({ isAlerting: alert }),
  setRedAlert: (alert) => set({ isRedAlert: alert }),
  clearAlerts: () => set({ violations: [], lastViolation: null, isAlerting: false, isRedAlert: false })
}))