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
  isOnboardingMode: boolean // 新增：新兵带教模式
  isAiOptimizeEnabled: boolean
  // ... 其他状态
  setAiAnalysis: (a: AiUltraAnalysis) => void
  setOnboardingMode: (enabled: boolean) => void // 新增：设置带教模式
  setAiOptimize: (enabled: boolean) => void
  // ...
}

export const useRiskStore = create<RiskState>((set) => ({
  isOnline: true,
  isAlerting: false,
  isRedAlert: false,
  isOnboardingMode: true, // 默认开启，辅助新人
  isAiOptimizeEnabled: false,
  // ...
  setOnboardingMode: (enabled) => set({ isOnboardingMode: enabled }),
  // ...
}))
