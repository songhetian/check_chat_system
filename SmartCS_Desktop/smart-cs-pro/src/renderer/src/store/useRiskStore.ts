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

interface AiAnalysis {
  risk_score: number
  reason: string
  suggestion: string
  context: string
}

interface RiskState {
  isOnline: boolean // 新增：链路状态
  isAlerting: boolean
  isRedAlert: boolean
  lastViolation: Violation | null
  lastAiAnalysis: AiAnalysis | null
  violations: Violation[]
  sendMessage: (msg: any) => void
  addViolation: (v: Violation) => void
  setAiAnalysis: (a: AiAnalysis) => void
  setAlerting: (alert: boolean) => void
  setRedAlert: (alert: boolean) => void
  setOnline: (online: boolean) => void // 新增：设置在线状态
  setSendMessage: (fn: (msg: any) => void) => void
  clearAlerts: () => void
}

export const useRiskStore = create<RiskState>((set) => ({
  isOnline: true,
  isAlerting: false,
  isRedAlert: false,
  lastViolation: null,
  lastAiAnalysis: null,
  violations: [],
  sendMessage: () => {}, 
  addViolation: (v) => set((state) => ({
    violations: [v, ...state.violations].slice(0, 100),
    lastViolation: v,
    isAlerting: true
  })),
  setAiAnalysis: (a) => set({ lastAiAnalysis: a, isAlerting: a.risk_score > 7 }),
  setAlerting: (alert) => set({ isAlerting: alert }),
  setRedAlert: (alert) => set({ isRedAlert: alert }),
  setOnline: (online) => set({ isOnline: online }),
  setSendMessage: (fn) => set({ sendMessage: fn }),
  clearAlerts: () => set({ violations: [], lastViolation: null, isAlerting: false, isRedAlert: false, lastAiAnalysis: null })
}))