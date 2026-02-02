import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Zap, 
  Video, 
  VolumeX, 
  BrainCircuit, 
  Copy, 
  WifiOff, 
  History, 
  Trophy,
  Activity,
  MousePointer2,
  TrendingUp,
  BarChart,
  PieChart as PieIcon
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, sendMessage, lastAiAnalysis, isOnline, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')

  // 核心：同步 Electron 窗口尺寸
  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 550 : 48 // 增加高度以容纳饼图
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  // 战术数据处理：计算记录分布
  const violationStats = useMemo(() => {
    if (!violations.length) return null
    const counts: Record<string, number> = {}
    violations.forEach(v => {
      counts[v.keyword] = (counts[v.keyword] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ 
      name, 
      value, 
      percent: Math.round((value / violations.length) * 100) 
    })).sort((a, b) => b.value - a.value).slice(0, 3) // 只展示前三名
  }, [violations])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    window.dispatchEvent(new CustomEvent('trigger-toast', { 
      detail: { title: '战术同步', message: '纠偏话术已就绪', type: 'success' } 
    }))
  }

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      <motion.div
        layout
        className={cn(
          "bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col select-none",
          "rounded-[32px]",
          lastAiAnalysis && "ring-2 ring-cyan-500/50"
        )}
        style={{ width: isAlerting ? 420 : isExpanded ? 550 : 240 }}
      >
        {/* Header (可拖拽) */}
        <div 
          className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAlerting ? "bg-white text-red-600" : "bg-cyan-500/20 text-cyan-400")}>
              <Shield size={16} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {isAlerting ? '🚨 拦截警报' : '🛡️ SMART-CS PRO'}
            </span>
          </div>
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <button 
               onClick={() => setIsExpanded(!isExpanded)}
               className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
             >
               <MousePointer2 size={12} className={cn("text-white transition-transform", isExpanded && "rotate-180")} />
             </button>
          </div>
        </div>

        {/* 内容区 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex p-2 bg-black/20 gap-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabButton id="AI" active={activeTab} set={setActiveTab} icon={<BrainCircuit size={12}/>} label="超脑建议" />
                 <TabButton id="HISTORY" active={activeTab} set={setActiveTab} icon={<History size={12}/>} label="记录分析" />
                 <TabButton id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={12}/>} label="战术数据" />
              </div>

              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'HISTORY' && (
                   <div className="space-y-6">
                      {/* 战术分析饼图部分 */}
                      {violationStats ? (
                        <div className="bg-white/5 rounded-[24px] p-5 border border-white/5 flex items-center gap-6">
                           {/* CSS Conic-Gradient Pie */}
                           <div className="relative w-24 h-24 shrink-0">
                              <div 
                                className="w-full h-full rounded-full" 
                                style={{ 
                                  background: `conic-gradient(
                                    #06b6d4 0% ${violationStats[0]?.percent || 0}%, 
                                    #f43f5e ${violationStats[0]?.percent || 0}% ${(violationStats[0]?.percent || 0) + (violationStats[1]?.percent || 0)}%, 
                                    #475569 ${(violationStats[0]?.percent || 0) + (violationStats[1]?.percent || 0)}% 100%
                                  )` 
                                }}
                              />
                              <div className="absolute inset-2 bg-slate-900 rounded-full flex flex-col items-center justify-center">
                                 <span className="text-[8px] font-black text-slate-500 uppercase">风险度</span>
                                 <span className="text-sm font-black text-white">{violations.length}</span>
                              </div>
                           </div>
                           
                           <div className="flex-1 space-y-3">
                              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <PieIcon size={10} /> 违规构成分析
                              </h4>
                              {violationStats.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className={cn("w-1.5 h-1.5 rounded-full", i===0?"bg-cyan-500":i===1?"bg-rose-500":"bg-slate-500")} />
                                      <span className="text-[10px] font-bold text-slate-300">{item.name}</span>
                                   </div>
                                   <span className="text-[10px] font-mono font-black text-white">{item.percent}%</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      ) : null}

                      {/* 详细记录流 */}
                      <div className="space-y-2">
                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block px-1">最近拦截轨迹</span>
                         {violations.length > 0 ? violations.slice(0, 5).map((v, i) => (
                           <div key={i} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-red-400 uppercase">{v.keyword}</span>
                                 <span className="text-[9px] text-slate-500 italic truncate w-40">"{v.context}"</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-1 h-1 rounded-full bg-slate-700" />
                                 <span className="text-[8px] font-mono text-slate-600">JUST NOW</span>
                              </div>
                           </div>
                         )) : <EmptyState text="战术环境安全" />}
                      </div>
                   </div>
                 )}

                 {/* 智脑建议与战绩页保持逻辑不变... */}
                 {activeTab === 'AI' && (
                   <div className="space-y-4">
                      {lastAiAnalysis ? (
                        <div className="bg-cyan-500/10 p-5 rounded-[32px] border border-cyan-500/20 relative group">
                           <div className="flex justify-between items-center mb-3">
                              <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={14}/> 纠偏方案</h4>
                              <div className="px-2 py-0.5 bg-cyan-500 text-slate-900 text-[8px] font-black rounded uppercase">AI Active</div>
                           </div>
                           <p className="text-[13px] text-white font-medium leading-relaxed mb-5 italic">"{lastAiAnalysis.suggestion}"</p>
                           <button onClick={(e) => { e.stopPropagation(); copyToClipboard(lastAiAnalysis.suggestion); }} className="w-full py-3 bg-cyan-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-[0_10px_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all">执行修正话术</button>
                        </div>
                      ) : <EmptyState text="正在深度分析对话语义..." />}
                   </div>
                 )}

                 {activeTab === 'STATS' && (
                   <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                         <StatTile title="今日纠偏" value="12" sub="RANK #1" icon={<Trophy size={14} className="text-amber-400"/>} />
                         <StatTile title="平均情绪分" value="82%" sub="极度信任" icon={<TrendingUp size={14} className="text-green-400"/>} />
                      </div>
                      <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><BarChart size={12}/> 纠偏负荷趋势</span>
                         </div>
                         <div className="h-24 flex items-end gap-2 px-2">
                            {[40, 70, 45, 90, 65, 80, 50, 30].map((h, i) => (
                              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className={cn("flex-1 rounded-t-lg", h > 80 ? "bg-red-500" : "bg-cyan-500/40")} />
                            ))}
                         </div>
                      </div>
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

function StatTile({ title, value, sub, icon }: any) {
  return (
    <div className="bg-white/5 p-4 rounded-3xl border border-white/5 relative overflow-hidden">
       <div className="flex justify-between items-start mb-1">
          <span className="text-[8px] text-slate-500 font-black uppercase">{title}</span>
          {icon}
       </div>
       <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
       <div className="text-[8px] font-bold text-cyan-500 mt-1 uppercase">{sub}</div>
    </div>
  )
}

function TabButton({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (
    <button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all", isSelected ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}>
      {icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 mt-10">
       <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-cyan-500 animate-spin" />
       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{text}</p>
    </div>
  )
}