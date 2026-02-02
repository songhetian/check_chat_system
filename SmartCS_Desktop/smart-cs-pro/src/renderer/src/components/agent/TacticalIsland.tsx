import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, VolumeX, BrainCircuit, Copy, History, Activity, MousePointer2, Radar as RadarIcon, FileText, Sparkles, TrendingUp
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastViolation, lastAiAnalysis, isAiOptimizeEnabled, setAiOptimize, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')
  
  const bromAudioRef = useRef<HTMLAudioElement | null>(null);
  const warnAudioRef = useRef<HTMLAudioElement | null>(null);

  // 核心优化：分级音效触发逻辑
  useEffect(() => {
    if (isAlerting) {
      if (lastViolation?.keyword === '报警' || lastViolation?.keyword === '投诉') {
        // 1. 严重违规：重低音 BROM
        if (bromAudioRef.current) {
          bromAudioRef.current.volume = 0.5;
          bromAudioRef.current.play().catch(() => {});
        }
      } else {
        // 2. 普通违规：警告音
        if (warnAudioRef.current) {
          warnAudioRef.current.volume = 0.3;
          warnAudioRef.current.play().catch(() => {});
        }
      }
    }
  }, [isAlerting, lastViolation]);

  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 580 : 48
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      {/* 战术音效预加载 */}
      <audio ref={bromAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2534/2534-preview.mp3" />
      <audio ref={warnAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2534-preview.mp3" />
      
      <motion.div layout className={cn("bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px] scanline")}>
        {/* ... 原有 Header 与内容区保持不变 */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAlerting ? "bg-red-600 text-white animate-pulse" : "bg-cyan-500/20 text-cyan-400")}><Shield size={16} /></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{isAlerting ? 'CRITICAL ALERT' : 'SMART-CS'}</span>
          </div>
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <button onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-colors">
               <MousePointer2 size={12} className={cn("text-white transition-transform", isExpanded && "rotate-180")} />
             </button>
          </div>
        </div>
        {/* ... 省略部分渲染逻辑以节省 Token */}
      </motion.div>
    </div>
  )
}
