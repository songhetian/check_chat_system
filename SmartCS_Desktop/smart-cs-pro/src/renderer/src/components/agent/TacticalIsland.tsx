import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export const TacticalIsland = () => {
  const { isAlerting, lastAiAnalysis, isOnline, violations, isMuted, setMuted } = useRiskStore()
  const { user, logout } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'STATS'>('AI')

  // 横向中枢条适配：收缩时 520x64, 展开时 520x600
  useEffect(() => {
    const width = 520
    const height = isExpanded ? 600 : 64
    window.electron.ipcRenderer.send('resize-window', { width, height })
    window.electron.ipcRenderer.send('set-always-on-top', true)
  }, [isExpanded])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-2 overflow-hidden pointer-events-none select-none">
      <motion.div 
        layout
        className={cn(
          "pointer-events-auto bg-slate-950/90 border border-white/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-500 rounded-[28px]",
          isAlerting && "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] ring-1 ring-red-500/20"
        )}
      >
        {/* 1. 战术中枢条 (Main Bar) */}
        <div 
          className="flex items-center justify-between px-4 h-[64px] shrink-0 cursor-move" 
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {/* 左侧：用户信息 & 头像 */}
          <div className="flex items-center gap-3 min-w-[160px]">
            <div className="relative">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500",
                isOnline ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"
              )}>
                {user?.real_name ? user.real_name[0] : <UserIcon size={18} />}
              </div>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 transition-colors duration-500",
                isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500"
              )} />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-white tracking-wider uppercase">
                {user?.real_name || '未登录'}
              </span>
              <span className="text-[9px] font-bold text-slate-500 tracking-tighter">
                {isOnline ? '战术链路已建立' : '链路处于脱机状态'}
              </span>
            </div>
          </div>

          {/* 中间：核心控制组 (不含拖拽) */}
          <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <HubBtn 
              icon={isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />} 
              active={isMuted} 
              isRed={isMuted}
              onClick={() => setMuted(!isMuted)}
              title={isMuted ? "取消静音" : "开启静音"}
            />
            <div className="w-px h-6 bg-white/10 mx-1" />
            <HubBtn 
              icon={<Shield size={18} />} 
              active={isAlerting} 
              isRed={isAlerting} 
              title="报警状态"
            />
            <HubBtn 
              icon={<LayoutGrid size={18} />} 
              active={isExpanded} 
              onClick={() => setIsExpanded(!isExpanded)} 
              title="展开面板"
            />
          </div>

          {/* 右侧：状态指标 & 退出 */}
          <div className="flex items-center gap-3 min-w-[120px] justify-end" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="flex flex-col items-end mr-2">
               <span className="text-[8px] font-black text-slate-500 uppercase">Risk Index</span>
               <span className={cn("text-[13px] font-mono font-black", isAlerting ? "text-red-500" : "text-cyan-400")}>
                 {lastAiAnalysis?.risk_score || 0}%
               </span>
            </div>
            <button 
              onClick={() => { logout(); window.location.hash = '/login'; }}
              className="w-10 h-10 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* 2. 展开面板 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden border-t border-white/5"
            >
              {/* 导航标签 */}
              <div className="flex p-2 bg-black/40 gap-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<BrainCircuit size={16}/>} label="智能核对" />
                 <TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={16}/>} label="全域雷达" />
                 <TabBtn id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={16}/>} label="战术数据" />
              </div>

              {/* 内容区域 */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-6">
                      <div className="p-5 bg-white/5 border border-white/10 rounded-[24px] relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Target size={60} />
                         </div>
                         <h4 className="text-[11px] font-black text-cyan-500 uppercase mb-3 flex items-center gap-2 tracking-widest">
                           <Terminal size={14} /> 实时建议策略
                         </h4>
                         <p className="text-[14px] text-slate-200 leading-relaxed font-medium">
                           {lastAiAnalysis?.strategy || "链路同步正常，智脑正在进行深度对话流解析..."}
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <StatBox label="当前风险指数" value={`${lastAiAnalysis?.risk_score || 0}%`} />
                         <StatBox label="情感波动偏移" value={`${lastAiAnalysis?.sentiment_score || 0}`} isCyan />
                      </div>
                   </div>
                 )}

                 {activeTab === 'RADAR' && (
                   <div className="space-y-4">
                      {violations.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                           <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                              <AlertCircle size={20} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-bold text-white truncate">{v.keyword}</div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase">{new Date(v.timestamp).toLocaleTimeString()}</div>
                           </div>
                           <ChevronRight size={14} className="text-slate-800" />
                        </div>
                      ))}
                      {violations.length === 0 && (
                         <div className="h-40 flex flex-col items-center justify-center text-slate-600 italic opacity-40">
                            <RadarIcon size={40} className="mb-2 animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">雷达扫描空网中...</span>
                         </div>
                      )}
                   </div>
                 )}

                 {activeTab === 'STATS' && (
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-5 rounded-[24px] border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[9px] font-black text-slate-500 uppercase">综合战术评分</span>
                               <Trophy size={16} className="text-amber-500" />
                            </div>
                            <div className="text-2xl font-black text-white">2,450</div>
                         </div>
                         <div className="bg-white/5 p-5 rounded-[24px] border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[9px] font-black text-slate-500 uppercase">风险对冲抵扣</span>
                               <Zap size={16} className="text-red-500" />
                            </div>
                            <div className="text-2xl font-black text-white">-150</div>
                         </div>
                      </div>
                      <div className="bg-black/60 p-5 rounded-[24px] border border-white/5">
                         <div className="flex justify-between items-center mb-4 text-slate-500">
                            <span className="text-[11px] font-black uppercase tracking-widest">实时效能脉冲</span>
                            <BarChart size={14} />
                         </div>
                         <div className="h-20 flex items-end gap-2 px-1">
                            {[40, 70, 45, 90, 65, 80, 50, 30, 60, 40, 55, 75].map((h, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ height: 0 }} 
                                animate={{ height: `${h}%` }} 
                                className={cn("flex-1 rounded-t-sm transition-all", h > 85 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-cyan-500/40")} 
                              />
                            ))}
                         </div>
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-widest">Link Protocol: SECURE</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{CONFIG.APP_VERSION}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, isRed, title }: any) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
        active 
          ? (isRed ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white text-black") 
          : "text-slate-500 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
    </button>
  )
}

function TabBtn({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); set(id); }} 
      className={cn(
        "flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 relative overflow-hidden",
        isSelected ? "bg-white/10 text-cyan-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      {isSelected && (
        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
      )}
    </button>
  )
}

function StatBox({ label, value, isCyan }: any) {
  return (
    <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
       <div className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-tighter">{label}</div>
       <div className={cn("text-2xl font-black", isCyan ? "text-cyan-400" : "text-white")}>{value}</div>
    </div>
  )
}