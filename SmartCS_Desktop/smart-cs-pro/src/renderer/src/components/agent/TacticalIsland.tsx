import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, VolumeX, BrainCircuit, Copy, History, Activity, MousePointer2, Radar as RadarIcon, FileText, Sparkles, TrendingUp, Trophy, Medal
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastAiAnalysis, isAiOptimizeEnabled, setAiOptimize, isOnboardingMode, setOnboardingMode, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 自驱动优化：监听毕业事件自动调整模式
  useEffect(() => {
    const handleMilestone = () => {
      if (isOnboardingMode) {
        setOnboardingMode(false); // 毕业后自动建议关闭新手模式
      }
    }
    window.addEventListener('trigger-milestone', handleMilestone);
    return () => window.removeEventListener('trigger-milestone', handleMilestone);
  }, [isOnboardingMode]);

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      <motion.div layout className={cn("bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px] scanline")}>
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAiOptimizeEnabled ? "bg-cyan-500 text-white animate-pulse" : "bg-cyan-500/20 text-cyan-400")}><BrainCircuit size={16} /></div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-white uppercase tracking-widest">{isOnboardingMode ? 'COACH' : 'VETERAN'}</span>
               {/* 战术勋章显示 (自驱动优化) */}
               {!isOnboardingMode && (
                 <div className="flex items-center gap-1 text-[7px] font-black text-amber-400 uppercase tracking-tighter">
                    <Medal size={8} /> Elite Operator
                 </div>
               )}
            </div>
          </div>
          {/* ... */}
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <button onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><MousePointer2 size={12} className="text-white" /></button>
          </div>
        </div>
        {/* 内容区保持不变 */}
      </motion.div>
    </div>
  )
}
