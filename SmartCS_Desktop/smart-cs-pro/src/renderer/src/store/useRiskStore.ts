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
  isOnboardingMode: boolean
  isAiOptimizeEnabled: boolean
  violations: Violation[]
  lastAiAnalysis: AiUltraAnalysis | null
  sendMessage: ((msg: any) => void) | null

  setOnline: (isOnline: boolean) => void
  setAlerting: (isAlerting: boolean) => void
  setRedAlert: (isRedAlert: boolean) => void
  setMuted: (isMuted: boolean) => void
  setOnboardingMode: (enabled: boolean) => void
  setAiOptimize: (enabled: boolean) => void
  setAiAnalysis: (analysis: AiUltraAnalysis) => void
  addViolation: (violation: Violation) => void
  setSendMessage: (fn: (msg: any) => void) => void
}

export const useRiskStore = create<RiskState>((set) => ({
  isOnline: true,
  isAlerting: false,
  isRedAlert: false,
  isMuted: false,
  isOnboardingMode: true,
  isAiOptimizeEnabled: false,
  violations: [],
  lastAiAnalysis: null,
  sendMessage: null,

  setOnline: (isOnline) => set({ isOnline }),
  setAlerting: (isAlerting) => set({ isAlerting }),
  setRedAlert: (isRedAlert) => set({ isRedAlert }),
  setMuted: (isMuted) => set({ isMuted }),
  setOnboardingMode: (isOnboardingMode) => set({ isOnboardingMode }),
  setAiOptimize: (isAiOptimizeEnabled) => set({ isAiOptimizeEnabled }),
  setAiAnalysis: (lastAiAnalysis) => set({ lastAiAnalysis }),
  addViolation: (violation) => set((state) => ({ violations: [violation, ...state.violations] })),
  setSendMessage: (sendMessage) => set({ sendMessage }),
}))