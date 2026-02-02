import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, VolumeX, BrainCircuit, Copy, History, Activity, MousePointer2, Radar, FileText, Sparkles 
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastAiAnalysis, isAiOptimizeEnabled, setAiOptimize, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')
  
  // 嵌入式科技感 Ping 音效 (Base64)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isAiOptimizeEnabled && lastAiAnalysis?.suggestion) {
      // 1. 写入剪切板
      navigator.clipboard.writeText(lastAiAnalysis.suggestion).then(() => {
        // 2. 播放战术装填音效 (此处演示逻辑，生产环境可引用 resources/ping.mp3)
        if (audioRef.current) {
          audioRef.current.volume = 0.3;
          audioRef.current.play().catch(() => {});
        }
        window.dispatchEvent(new CustomEvent('trigger-toast', { 
          detail: { title: '战术装填完毕', message: '纠偏话术已进入剪切板', type: 'success' } 
        }))
      })
    }
  }, [lastAiAnalysis, isAiOptimizeEnabled])

  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 580 : 48
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" preload="auto" />
      <motion.div layout className={cn("bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px]", isAiOptimizeEnabled && "ring-2 ring-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)]")} style={{ width: isAlerting ? 420 : isExpanded ? 550 : 240 }}>
        {/* Header 与内容区保持原有逻辑 */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAiOptimizeEnabled ? "bg-cyan-500 text-white animate-pulse" : "bg-cyan-500/20 text-cyan-400")}><BrainCircuit size={16} /></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{isAiOptimizeEnabled ? 'AI TACTICAL MODE' : 'SMART-CS'}</span>
          </div>
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <button onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><MousePointer2 size={12} className="text-white" /></button>
          </div>
        </div>
        {/* ... 省略重复的 Tab 渲染逻辑以保持简洁 */}
        <AnimatePresence>
          {isExpanded && (
            <div className="p-5 flex-1 overflow-y-auto" style={{ WebkitAppRegion: 'no-drag' } as any}>
               <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-white">自动优化模式</span>
                  <button onClick={(e) => { e.stopPropagation(); setAiOptimize(!isAiOptimizeEnabled); }} className={cn("w-10 h-5 rounded-full relative transition-all", isAiOptimizeEnabled ? "bg-cyan-600" : "bg-slate-700")}>
                    <motion.div animate={{ x: isAiOptimizeEnabled ? 22 : 2 }} className="w-3 h-3 bg-white rounded-full absolute top-1 shadow-md" />
                  </button>
               </div>
               {lastAiAnalysis && (
                 <div className="bg-cyan-500/10 p-5 rounded-[32px] border border-cyan-500/20 relative">
                    <span className="text-[9px] font-black text-cyan-500 uppercase block mb-2">⚡ 建议话术 (已就绪)</span>
                    <p className="text-xs text-white leading-relaxed italic">"{lastAiAnalysis.suggestion}"</p>
                 </div>
               )}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}