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
    violations: Violation[]
    resolvedViolations: Violation[]
    lastAiAnalysis: AiUltraAnalysis | null
    sendMessage: ((msg: any) => void) | null
  
    setOnline: (isOnline: boolean) => void
    setAlerting: (isAlerting: boolean) => void
    setRedAlert: (isRedAlert: boolean) => void
    setMuted: (isMuted: boolean) => void
    setGlassMode: (enabled: boolean) => void
    setOnboardingMode: (enabled: boolean) => void
    setAiOptimize: (enabled: boolean) => void
    setAiAnalysis: (analysis: AiUltraAnalysis) => void
    addViolation: (violation: Violation) => void
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
    violations: [],
    resolvedViolations: [],
    lastAiAnalysis: null,
    sendMessage: null,
  
    setOnline: (isOnline) => set({ isOnline }),
    setAlerting: (isAlerting) => set({ isAlerting }),
    setRedAlert: (isRedAlert) => set({ isRedAlert }),
    setMuted: (isMuted) => set({ isMuted }),
    setGlassMode: (isGlassMode) => set({ isGlassMode }),
    setOnboardingMode: (isOnboardingMode) => set({ isOnboardingMode }),
    setAiOptimize: (isAiOptimizeEnabled) => set({ isAiOptimizeEnabled }),
    setAiAnalysis: (lastAiAnalysis) => set({ lastAiAnalysis }),
    addViolation: (violation) => set((state) => ({ violations: [violation, ...state.violations] })),
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
  