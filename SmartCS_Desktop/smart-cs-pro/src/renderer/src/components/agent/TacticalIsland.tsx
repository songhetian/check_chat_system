import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, VolumeX, BrainCircuit, Copy, History, Activity, MousePointer2, Radar as RadarIcon, FileText, Sparkles, TrendingUp, Trophy
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastViolation, lastAiAnalysis, isAiOptimizeEnabled, setAiOptimize, isOnboardingMode, setOnboardingMode, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')
  
  const bromAudioRef = useRef<HTMLAudioElement | null>(null);
  const warnAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1. 自动上剪切板逻辑
  useEffect(() => {
    if (isAiOptimizeEnabled && lastAiAnalysis?.suggestion) {
      navigator.clipboard.writeText(lastAiAnalysis.suggestion).then(() => {
        if (warnAudioRef.current) { warnAudioRef.current.volume = 0.2; warnAudioRef.current.play().catch(()=>{}); }
      })
    }
  }, [lastAiAnalysis, isAiOptimizeEnabled])

  // 2. 窗口尺寸自适应
  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 620 : 48
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      <audio ref={bromAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2534/2534-preview.mp3" />
      <audio ref={warnAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2534-preview.mp3" />
      
      <motion.div layout className={cn("bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px] scanline")}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAlerting ? "bg-red-600 text-white" : "bg-cyan-500/20 text-cyan-400")}>
              <Shield size={16} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {isAlerting ? 'CRITICAL' : isOnboardingMode ? 'Coach Mode' : 'Tactical Pro'}
            </span>
          </div>
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <button onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-colors">
               <MousePointer2 size={12} className={cn("text-white transition-transform", isExpanded && "rotate-180")} />
             </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex p-2 bg-black/20 gap-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabButton id="AI" active={activeTab} set={setActiveTab} icon={<BrainCircuit size={12}/>} label="超脑" />
                 <TabButton id="HISTORY" active={activeTab} set={setActiveTab} icon={<RadarIcon size={12}/>} label="雷达" />
                 <TabButton id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={12}/>} label="数据" />
              </div>

              <div className="flex-1 p-5 overflow-y-auto" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {/* 状态控制矩阵 */}
                 <div className="grid grid-cols-2 gap-3 mb-5">
                    <ControlTile label="AI 优化模式" active={isAiOptimizeEnabled} onClick={() => setAiOptimize(!isAiOptimizeEnabled)} color="bg-cyan-600" />
                    <ControlTile label="新兵带教模式" active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} color="bg-amber-600" />
                 </div>

                 {activeTab === 'AI' && (
                   <div className="space-y-4">
                      {/* 带教建议卡片 */}
                      {isOnboardingMode && (
                        <div className="bg-amber-500/10 p-4 rounded-3xl border border-amber-500/20 animate-in fade-in slide-in-from-top-2">
                           <div className="flex items-center gap-2 text-amber-500 font-black text-[9px] uppercase mb-2">
                              <Trophy size={12} /> 教官实战指引
                           </div>
                           <p className="text-[11px] text-amber-100/80 leading-relaxed italic">
                              "检测到客户询问价格。新人请注意：不要直接报价，先强调【服务价值】与【售后保障】。参考话术已装填。"
                           </p>
                        </div>
                      )}

                      {lastAiAnalysis ? (
                        <div className="bg-cyan-500/10 p-5 rounded-[32px] border border-cyan-500/20">
                           <span className="text-[9px] font-black text-cyan-400 uppercase block mb-3 tracking-widest">战术修正建议</span>
                           <p className="text-sm text-white font-medium italic leading-relaxed mb-5">"{lastAiAnalysis.suggestion}"</p>
                           <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(lastAiAnalysis.suggestion); }} className="w-full py-3 bg-cyan-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl">手动覆盖剪切板</button>
                        </div>
                      ) : <EmptyState text="等待实时信号输入" />}
                   </div>
                 )}
                 {/* ... 雷达与数据页逻辑在生产环境可在此补全 */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function ControlTile({ label, active, onClick, color }: any) {
  return (
    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
       <span className="text-[9px] font-black text-slate-500 uppercase">{label}</span>
       <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={cn("w-8 h-4 rounded-full relative transition-all", active ? color : "bg-slate-700")}>
          <motion.div animate={{ x: active ? 18 : 2 }} className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5" />
       </button>
    </div>
  )
}

function TabButton({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return <button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all", isSelected ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span></button>
}

function EmptyState({ text }: { text: string }) {
  return <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 mt-10"><div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-cyan-500 animate-spin" /><p className="text-[10px] font-black text-slate-600 uppercase">{text}</p></div>
}