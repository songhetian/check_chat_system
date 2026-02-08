import { create } from 'zustand'

export interface Violation {
  id: string
  agent: string
  keyword: string
  context: string
  timestamp: number
  screenshot?: string
  reason?: string
  // Add other fields if needed based on usage
  type?: string
  risk_level?: string
}

export interface AiUltraAnalysis {
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
  isMuted: boolean
  isGlassMode: boolean
  isOnboardingMode: boolean
  isAiOptimizeEnabled: boolean
  isScreenMaximized: boolean // V3.19: 全局全屏观察状态
  isLocked: boolean // V3.22: 物理锁定状态
  lockMessage: string // V3.86: 锁定提示文案
  layoutMode: 'FLOAT' | 'SIDE'
  activeSideTool: 'PRODUCTS' | 'KNOWLEDGE' | 'CUSTOMERS' | null
  isCustomerHudEnabled: boolean
  currentCustomer: any | null
  violations: Violation[]
  resolvedViolations: Violation[]
  sopHistory: any[] // V3.88: SOP 指令历史记录
  lastAiAnalysis: AiUltraAnalysis | null
  sendMessage: ((msg: any) => void) | null

  setOnline: (isOnline: boolean) => void
  setAlerting: (isAlerting: boolean) => void
  setRedAlert: (isRedAlert: boolean) => void
  setMuted: (isMuted: boolean) => void
  setGlassMode: (enabled: boolean) => void
  setOnboardingMode: (enabled: boolean) => void
  setAiOptimize: (enabled: boolean) => void
  setIsScreenMaximized: (enabled: boolean) => void
  setIsLocked: (enabled: boolean) => void
  setLockMessage: (msg: string) => void
  setLayoutMode: (mode: 'FLOAT' | 'SIDE') => void
  setActiveSideTool: (tool: 'PRODUCTS' | 'KNOWLEDGE' | null) => void
  setCustomerHudEnabled: (enabled: boolean) => void
  setCurrentCustomer: (customer: any | null) => void
  setAiAnalysis: (analysis: AiUltraAnalysis) => void
  addViolation: (violation: Violation) => void
  addSopHistory: (sop: any) => void
  resolveViolation: (violationId: string, solution: string) => void
  setSendMessage: (fn: (msg: any) => void) => void
}

export const useRiskStore = create<RiskState>((set) => ({
  isOnline: true,
  isAlerting: false,
  isRedAlert: false,
  isMuted: false,
  isGlassMode: true,
  isOnboardingMode: true,
  isAiOptimizeEnabled: false,
  isScreenMaximized: false,
  isLocked: false,
  lockMessage: '',
  layoutMode: 'FLOAT',
  activeSideTool: null,
  isCustomerHudEnabled: false,
  currentCustomer: null,
  violations: [],
  resolvedViolations: [],
  sopHistory: [],
  lastAiAnalysis: null,
  sendMessage: null,

  setOnline: (isOnline) => set({ isOnline }),
  setAlerting: (isAlerting) => set({ isAlerting }),
  setRedAlert: (isRedAlert) => set({ isRedAlert }),
  setMuted: (isMuted) => set({ isMuted }),
  setGlassMode: (isGlassMode) => set({ isGlassMode }),
  setOnboardingMode: (isOnboardingMode) => set({ isOnboardingMode }),
  setAiOptimize: (isAiOptimizeEnabled) => set({ isAiOptimizeEnabled }),
  setIsScreenMaximized: (isScreenMaximized) => set({ isScreenMaximized }),
  setIsLocked: (isLocked) => set({ isLocked }),
  setLockMessage: (lockMessage) => set({ lockMessage }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setActiveSideTool: (activeSideTool) => set({ activeSideTool }),
  setCustomerHudEnabled: (isCustomerHudEnabled) => set({ isCustomerHudEnabled }),
  setCurrentCustomer: (currentCustomer) => set({ currentCustomer }),
  setAiAnalysis: (lastAiAnalysis) => set({ lastAiAnalysis }),
  addViolation: (violation) => set((state) => ({ violations: [violation, ...state.violations] })),
  addSopHistory: (sop) => set((state) => ({ 
    sopHistory: [
      { ...sop, timestamp: Date.now(), id: `sop_${Date.now()}` }, 
      ...state.sopHistory.slice(0, 19) // 仅保留最近 20 条
    ] 
  })),
  resolveViolation: (id, solution) => set((state) => {
    const v = state.violations.find(x => x.id === id);
    if (!v) return state;
    return {
      violations: state.violations.filter(x => x.id !== id),
      resolvedViolations: [{ ...v, reason: solution }, ...state.resolvedViolations]
    }
  }),
  setSendMessage: (sendMessage) => set({ sendMessage }),
}))
  