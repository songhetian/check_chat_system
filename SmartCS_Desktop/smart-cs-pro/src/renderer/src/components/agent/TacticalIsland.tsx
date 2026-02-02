import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Zap, 
  VolumeX, 
  BrainCircuit, 
  Copy, 
  History, 
  Activity,
  MousePointer2,
  Radar,
  FileText,
  Sparkles
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastAiAnalysis, isOnline, isAiOptimizeEnabled, setAiOptimize, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')

  // 核心优化：AI 建议产生后，自动加入剪切板
  useEffect(() => {
    if (isAiOptimizeEnabled && lastAiAnalysis?.suggestion) {
      navigator.clipboard.writeText(lastAiAnalysis.suggestion).then(() => {
        window.dispatchEvent(new CustomEvent('trigger-toast', { 
          detail: { title: '战术自动装填', message: '优化话术已进入剪切板，直接粘贴即可', type: 'success' } 
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
      <motion.div layout className={cn("bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px]", isAiOptimizeEnabled && "ring-2 ring-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)]")} style={{ width: isAlerting ? 420 : isExpanded ? 550 : 240 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAiOptimizeEnabled ? "bg-cyan-500 text-white animate-pulse" : "bg-cyan-500/20 text-cyan-400")}>
              <BrainCircuit size={16} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {isAiOptimizeEnabled ? 'AI 战术增强中' : 'Tactical Link'}
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
                 <TabButton id="AI" active={activeTab} set={setActiveTab} icon={<Sparkles size={12}/>} label="智能辅助" />
                 <TabButton id="HISTORY" active={activeTab} set={setActiveTab} icon={<History size={12}/>} label="记录分析" />
                 <TabButton id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={12}/>} label="战绩" />
              </div>

              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-4">
                      {/* AI 开关与模式选择 */}
                      <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", isAiOptimizeEnabled ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-500")}><Zap size={20} /></div>
                            <div>
                               <div className="text-[10px] font-black text-white">自动优化并加入剪切板</div>
                               <div className="text-[8px] text-slate-500 font-bold uppercase">{isAiOptimizeEnabled ? '已开启：输入即就绪' : '已关闭'}</div>
                            </div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); setAiOptimize(!isAiOptimizeEnabled); }} className={cn("w-12 h-6 rounded-full relative transition-all", isAiOptimizeEnabled ? "bg-cyan-600" : "bg-slate-700")}>
                            <motion.div animate={{ x: isAiOptimizeEnabled ? 26 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-lg" />
                         </button>
                      </div>

                      {/* 智脑双模：优化与提炼 */}
                      {lastAiAnalysis ? (
                        <div className="space-y-3">
                           <div className="bg-cyan-500/10 p-5 rounded-[32px] border border-cyan-500/20">
                              <span className="text-[9px] font-black text-cyan-500 uppercase flex items-center gap-1 mb-2"><Sparkles size={10}/> 智能纠偏 (已入剪切板)</span>
                              <p className="text-xs text-white leading-relaxed italic mb-4">"{lastAiAnalysis.suggestion}"</p>
                              <div className="flex gap-2">
                                 <button className="flex-1 py-2.5 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95">再次精炼</button>
                                 <button className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 flex items-center justify-center gap-2"><FileText size={12}/> 生成总结</button>
                              </div>
                           </div>
                        </div>
                      ) : <div className="py-10 text-center text-slate-600 text-xs font-bold uppercase">等待捕获对话链路...</div>}
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function TabButton({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return <button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all", isSelected ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span></button>
}
