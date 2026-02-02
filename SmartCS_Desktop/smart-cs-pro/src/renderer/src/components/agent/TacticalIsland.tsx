import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, VolumeX, BrainCircuit, Copy, History, Activity, MousePointer2, Radar as RadarIcon, FileText, Sparkles, TrendingUp
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastAiAnalysis, isAiOptimizeEnabled, setAiOptimize, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 580 : 48
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  // 雷达数据
  const radarData = useMemo(() => [65, 80, 45, 90, 70], [])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" preload="auto" />
      <motion.div 
        layout 
        className={cn(
          "bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px] scanline",
          lastAiAnalysis && "ring-2 ring-cyan-500/50"
        )} 
        style={{ width: isAlerting ? 420 : isExpanded ? 550 : 240 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAiOptimizeEnabled ? "bg-cyan-500 text-white animate-pulse" : "bg-cyan-500/20 text-cyan-400")}><BrainCircuit size={16} /></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Tactical Link Pro</span>
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
                 <TabButton id="AI" active={activeTab} set={setActiveTab} icon={<Sparkles size={12}/>} label="智脑" />
                 <TabButton id="HISTORY" active={activeTab} set={setActiveTab} icon={<RadarIcon size={12}/>} label="雷达" />
                 <TabButton id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={12}/>} label="全景" />
              </div>

              <div className="flex-1 p-5 overflow-y-auto" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'HISTORY' && (
                   <div className="space-y-6 flex flex-col items-center relative">
                      {/* 1. 战术雷达图 (带扫描光波) */}
                      <div className="bg-white/5 rounded-[32px] p-8 border border-white/5 relative flex items-center justify-center overflow-hidden">
                         {/* 背景光晕 */}
                         <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />
                         
                         <div className="relative w-56 h-56">
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                               <defs>
                                  <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                                     <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
                                     <stop offset="100%" stopColor="rgba(6, 182, 212, 0.4)" />
                                  </linearGradient>
                               </defs>

                               {/* 静态网格 */}
                               {[0.2, 0.4, 0.6, 0.8, 1].map((r, idx) => (
                                 <circle key={idx} cx="50" cy="50" r={r * 40} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                               ))}
                               <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                               <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

                               {/* 核心：旋转扫描波束 (新增) */}
                               <motion.path
                                 d="M 50 50 L 50 10 A 40 40 0 0 1 90 50 Z"
                                 fill="url(#radarSweep)"
                                 animate={{ rotate: 360 }}
                                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                 style={{ originX: "50px", originY: "50px" }}
                               />

                               {/* 数据多面体 */}
                               <polygon 
                                 points={getDataPoints(radarData)} 
                                 fill="rgba(6, 182, 212, 0.2)" 
                                 stroke="#06b6d4" 
                                 strokeWidth="1.5" 
                               />
                            </svg>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full">
                         <DimensionTile label="链路安全性" value="STABLE" />
                         <DimensionTile label="监控覆盖率" value="100%" />
                      </div>
                   </div>
                 )}
                 {/* AI 标签逻辑保持不变... */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function getDataPoints(data: number[]) {
  let p = []; for (let i = 0; i < 5; i++) { const r = (data[i] / 100) * 40; const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`); }
  return p.join(' ')
}
function DimensionTile({ label, value }: any) {
  return <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center"><div className="text-[8px] text-slate-500 font-black uppercase mb-1">{label}</div><div className="text-sm font-black text-cyan-400">{value}</div></div>
}
function TabButton({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return <button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all", isSelected ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span></button>
}
