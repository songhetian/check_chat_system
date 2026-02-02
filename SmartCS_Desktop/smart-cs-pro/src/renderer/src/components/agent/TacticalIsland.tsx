import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, VolumeX, BrainCircuit, Copy, History, Activity, MousePointer2, Radar as RadarIcon, Trophy, Medal, TrendingUp, BarChart
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastAiAnalysis, isAiOptimizeEnabled, setAiOptimize, isOnboardingMode, setOnboardingMode, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')

  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 650 : 48
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      <motion.div layout className={cn("bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px] scanline")}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAlerting ? "bg-red-600" : "bg-cyan-500/20 text-cyan-400")}><Shield size={16} /></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{isAlerting ? 'CRITICAL ALERT' : 'TACTICAL PRO'}</span>
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-colors">
             <MousePointer2 size={12} className={cn("text-white transition-transform", isExpanded && "rotate-180")} />
          </button>
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
                 {activeTab === 'STATS' && (
                   <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                         <StatTile title="综合战术分" value="2,450" sub="GLOBAL RANK #1" icon={<Trophy size={14} className="text-amber-400"/>} />
                         <StatTile title="风险对冲抵扣" value="-150" sub="VIOLATION PENALTY" icon={<Shield size={14} className="text-red-400"/>} />
                      </div>
                      <div className="bg-white/5 rounded-[32px] p-5 border border-white/5">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><BarChart size={12}/> 战术效能脉冲</span>
                            <span className="text-[8px] font-bold text-green-500">POSITIVE</span>
                         </div>
                         <div className="h-24 flex items-end gap-2 px-2">
                            {[40, 70, 45, 90, 65, 80, 50, 30].map((h, i) => (
                              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className={cn("flex-1 rounded-t-lg", h > 80 ? "bg-red-500" : "bg-cyan-500/40")} />
                            ))}
                         </div>
                      </div>
                   </div>
                 )}
                 {/* ... AI与雷达页保持逻辑 */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function StatTile({ title, value, sub, icon }: any) {
  return (
    <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
       <div className="flex justify-between items-start mb-1"><span className="text-[8px] text-slate-500 font-black uppercase">{title}</span>{icon}</div>
       <div className={cn("text-2xl font-black text-white tracking-tighter", value.startsWith('-') && "text-red-400")}>{value}</div>
       <div className="text-[8px] font-bold text-cyan-500 mt-1 uppercase">{sub}</div>
    </div>
  )
}
function TabButton({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return <button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all", isSelected ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span></button>
}