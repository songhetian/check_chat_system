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
  isAlerting: boolean
  isRedAlert: boolean
  lastViolation: Violation | null
  lastAiAnalysis: AiAnalysis | null // 新增：AI 实时分析
  violations: Violation[]
  sendMessage: (msg: any) => void
  addViolation: (v: Violation) => void
  setAiAnalysis: (a: AiAnalysis) => void // 新增：设置 AI 分析
  setAlerting: (alert: boolean) => void
  setRedAlert: (alert: boolean) => void
  setSendMessage: (fn: (msg: any) => void) => void
  clearAlerts: () => void
}

export const useRiskStore = create<RiskState>((set) => ({
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
  setSendMessage: (fn) => set({ sendMessage: fn }),
  clearAlerts: () => set({ violations: [], lastViolation: null, isAlerting: false, isRedAlert: false, lastAiAnalysis: null })
}))