import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, MousePointer2, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export const TacticalIsland = () => {
  const { isAlerting, lastAiAnalysis, isOnline, violations } = useRiskStore()
  const { user, logout } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'STATS'>('AI')

  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 500 : 280
    const height = isExpanded ? 600 : 64
    window.electron.ipcRenderer.send('resize-window', { width, height })
    // 灵动岛模式必须置顶
    window.electron.ipcRenderer.send('set-always-on-top', true)
  }, [isExpanded, isAlerting])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden pointer-events-none p-2">
      <motion.div 
        layout
        className={cn(
          "pointer-events-auto bg-slate-950/85 border border-white/10 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col select-none rounded-[28px] transition-all duration-500",
          isAlerting && "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
        )}
      >
        {/* 顶部主状态条 */}
        <div 
          className="flex items-center justify-between px-5 h-[56px] shrink-0 cursor-move relative" 
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 font-black text-[10px]",
                isAlerting ? "bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-white" : "bg-cyan-500/20 text-cyan-400"
              )}>
                {isAlerting ? <Shield size={20} /> : CONFIG.BRANDING.logoText}
              </div>
              {!isAlerting && isOnline && (
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-1 bg-cyan-400/20 rounded-xl pointer-events-none"
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                {isAlerting ? '紧急风险拦截' : '战术链路已建立'}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")} />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                  操作员: {user?.real_name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button 
              onClick={() => {
                logout();
                window.location.hash = '/login';
              }} 
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all text-slate-500"
              title="断开中枢连接"
            >
              <LogOut size={14} />
            </button>
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="w-8 h-8 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition-all active:scale-90"
            >
              <MousePointer2 size={14} className={cn("transition-transform duration-500", isExpanded && "rotate-180")} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden border-t border-white/5"
            >
              {/* 导航标签 */}
              <div className="flex p-3 bg-black/40 gap-1.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabButton id="AI" active={activeTab} set={setActiveTab} icon={<BrainCircuit size={14}/>} label="智能核对" />
                 <TabButton id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={14}/>} label="全域雷达" />
                 <TabButton id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={14}/>} label="战术数据" />
              </div>

              {/* 内容区域 */}
              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-4">
                      <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BrainCircuit size={40} />
                         </div>
                         <h4 className="text-[10px] font-black text-cyan-500 uppercase mb-2 flex items-center gap-2">
                           <Target size={12} /> 智脑实时纠偏建议
                         </h4>
                         <p className="text-xs text-slate-300 italic leading-relaxed">
                           {lastAiAnalysis?.strategy || "智脑正在监听对话流，等待风险点触发..."}
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                            <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">当前风险值</div>
                            <div className="text-xl font-black text-white">{lastAiAnalysis?.risk_score || 0}</div>
                         </div>
                         <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                            <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">对话情感</div>
                            <div className="text-xl font-black text-cyan-400">+{lastAiAnalysis?.sentiment_score || 0}</div>
                         </div>
                      </div>
                   </div>
                 )}

                 {activeTab === 'RADAR' && (
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">最近风险截断记录</h4>
                      {violations.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                           <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                              <AlertCircle size={14} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold text-white truncate">{v.keyword}</div>
                              <div className="text-[8px] text-slate-500 truncate">{v.context}</div>
                           </div>
                           <ChevronRight size={12} className="text-slate-700" />
                        </div>
                      ))}
                      {violations.length === 0 && (
                        <div className="h-32 flex flex-col items-center justify-center text-slate-600 gap-2 italic">
                           <RadarIcon size={24} className="opacity-20 animate-pulse" />
                           <span className="text-[10px]">雷达空网，暂无异常记录</span>
                        </div>
                      )}
                   </div>
                 )}

                 {activeTab === 'STATS' && (
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                         <StatTile title="综合战术评分" value="2,450" sub="全域排名 #1" icon={<Trophy size={14} className="text-amber-400"/>} />
                         <StatTile title="风险对冲抵扣" value="-150" sub="违规扣除" icon={<Zap size={14} className="text-red-400"/>} />
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><BarChart size={12}/> 实时效能脉冲</span>
                         </div>
                         <div className="h-16 flex items-end gap-1.5 px-1">
                            {[40, 70, 45, 90, 65, 80, 50, 30, 60, 40].map((h, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ height: 0 }} 
                                animate={{ height: `${h}%` }} 
                                className={cn("flex-1 rounded-t-sm", h > 80 ? "bg-red-500" : "bg-cyan-500/40")} 
                              />
                            ))}
                         </div>
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="p-4 bg-black/20 border-t border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-cyan-500" />
                    <span className="text-[8px] font-mono text-cyan-900 tracking-tighter animate-pulse">链路连接正常: OK...</span>
                 </div>
                 <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{CONFIG.APP_VERSION}</span>
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
    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
       <div className="flex justify-between items-start mb-1">
         <span className="text-[8px] text-slate-500 font-black uppercase">{title}</span>
         {icon}
       </div>
       <div className={cn("text-xl font-black text-white tracking-tighter", value.startsWith('-') && "text-red-400")}>{value}</div>
       <div className="text-[8px] font-bold text-cyan-500 mt-1 uppercase opacity-60 group-hover:opacity-100 transition-opacity">{sub}</div>
    </div>
  )
}

function TabButton({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); set(id); }} 
      className={cn(
        "flex-1 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300",
        isSelected ? "bg-cyan-500/20 text-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]" : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
      {isSelected && (
        <motion.div layoutId="tab-underline" className="w-4 h-0.5 bg-cyan-500 rounded-full mt-0.5" />
      )}
    </button>
  )
}