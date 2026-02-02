import { create } from 'zustand'

interface Violation {
  id: string
  agent: string
  keyword: string
  context: string
  timestamp: number
  screenshot?: string
  reason?: string
}

interface AiUltraAnalysis {
  risk_score: number
  sentiment_score: number
  persona: { profession: string; personality: string; loyalty: string }
  strategy: string
  suggestion: string
}

interface RiskState {
  isOnline: boolean
  isAlerting: boolean
  isRedAlert: boolean
  lastViolation: Violation | null
  lastAiAnalysis: AiUltraAnalysis | null
  violations: Violation[]
  sendMessage: (msg: any) => void
  addViolation: (v: Violation) => void
  setAiAnalysis: (a: AiUltraAnalysis) => void
  setAlerting: (alert: boolean) => void
  setRedAlert: (alert: boolean) => void
  setOnline: (online: boolean) => void
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
