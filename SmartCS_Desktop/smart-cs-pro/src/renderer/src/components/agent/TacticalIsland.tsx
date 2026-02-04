import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export const TacticalIsland = () => {
  const { 
    isAlerting, lastAiAnalysis, isOnline, violations, isMuted, setMuted,
    isOnboardingMode, setOnboardingMode, isAiOptimizeEnabled, setAiOptimize,
    isGlassMode, setGlassMode
  } = useRiskStore()
  const { user, logout } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')

  // 灵动岛尺寸动态适配
  useEffect(() => {
    const width = 680
    const height = isExpanded ? 780 : 100
    window.electron.ipcRenderer.send('resize-window', { width, height })
    window.electron.ipcRenderer.send('set-always-on-top', true)
  }, [isExpanded])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-1 overflow-hidden pointer-events-none select-none bg-transparent">
      <motion.div 
        layout
        className={cn(
          "pointer-events-auto border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-500 rounded-[38px]",
          isGlassMode ? "bg-slate-950/85 backdrop-blur-3xl" : "bg-slate-950",
          isAlerting && "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] ring-1 ring-red-500/20"
        )}
      >
        {/* 1. 战术中枢条 (Main Bar) */}
        <div 
          className="flex items-center justify-between px-6 h-[80px] shrink-0 cursor-move" 
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {/* 左侧：用户信息 & 状态 */}
          <div className="flex items-center gap-3.5 min-w-[180px]">
            <div className="relative">
              <div className={cn(
                "w-11 h-11 rounded-[16px] flex items-center justify-center font-black text-lg transition-all duration-500",
                isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-600 border border-white/5"
              )}>
                {user?.real_name ? user.real_name[0] : <UserIcon size={22} />}
              </div>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[2.5px] border-slate-950 transition-all duration-500",
                isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 animate-pulse"
              )} />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-white tracking-widest uppercase flex items-center gap-1.5">
                {user?.real_name || 'Node'}
                {isOnboardingMode && <GraduationCap size={14} className="text-amber-400 animate-bounce" />}
              </span>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest opacity-60",
                isOnline ? "text-emerald-500" : "text-red-500"
              )}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* 中间：核心控制组 */}
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <HubBtn 
              icon={isGlassMode ? <Ghost size={18} /> : <Square size={18} />} 
              active={!isGlassMode} 
              onClick={() => setGlassMode(!isGlassMode)}
              title={isGlassMode ? "切换实色背景" : "切换磨砂玻璃"}
              color="white"
            />
            <div className="w-px h-6 bg-white/5 mx-0.5" />
            <HubBtn 
              icon={<GraduationCap size={18} />} 
              active={isOnboardingMode} 
              onClick={() => setOnboardingMode(!isOnboardingMode)}
              title="培训模式"
              color="emerald"
            />
            <HubBtn 
              icon={<Sparkles size={18} />} 
              active={isAiOptimizeEnabled} 
              onClick={() => setAiOptimize(!isAiOptimizeEnabled)}
              title="AI 优化"
              color="emerald"
            />
            <HubBtn 
              icon={isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />} 
              active={isMuted} 
              onClick={() => setMuted(!isMuted)}
              title="静音控制"
              color="red"
            />
            <HubBtn 
              icon={<LayoutGrid size={18} />} 
              active={isExpanded} 
              onClick={() => setIsExpanded(!isExpanded)} 
              title="看板"
              color="emerald"
            />
          </div>

          {/* 右侧：退出 */}
          <div className="flex items-center justify-end min-w-[60px]" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button 
              onClick={() => { logout(); window.location.hash = '/login'; }}
              className="w-10 h-10 rounded-2xl bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all group border border-white/5"
              title="退出登录"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 2. 展开看板 (Dashboard) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden border-t border-white/5 bg-gradient-to-b from-black/10 to-black/40"
            >
              <div className="flex p-2.5 bg-black/40 gap-2.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<Target size={17}/>} label="智脑核对" />
                 <TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={17}/>} label="全域雷达" />
                 <TabBtn id="TOOLS" active={activeTab} set={setActiveTab} icon={<Box size={17}/>} label="战术工具" />
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-7">
                      <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-[28px] relative overflow-hidden group">
                         <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000">
                            <BrainCircuit size={160} />
                         </div>
                         <h4 className="text-[11px] font-black text-cyan-400 uppercase mb-3 flex items-center gap-2.5 tracking-widest">
                           <Terminal size={15} /> 智脑建议策略
                         </h4>
                         <p className="text-[15px] text-slate-100 leading-relaxed font-semibold">
                           {lastAiAnalysis?.strategy || "中枢神经链路正常，正在进行实时话术矩阵校验..."}
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                         <DetailCard label="风险评估值" value={`${lastAiAnalysis?.risk_score || 0}%`} sub="Current Risk" />
                         <DetailCard label="对话情感偏移" value={lastAiAnalysis?.sentiment_score || 0} isCyan sub="Sentiment Deviation" />
                      </div>
                   </div>
                 )}

                 {activeTab === 'RADAR' && (
                   <div className="space-y-4">
                      {violations.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center gap-5 p-5 bg-white/5 rounded-[28px] border border-white/5 hover:bg-white/10 transition-all group">
                           <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                              <AlertCircle size={22} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-black text-white truncate mb-0.5">{v.keyword}</div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase flex items-center gap-2">
                                 <Monitor size={12} /> {new Date(v.timestamp).toLocaleTimeString()} · 已截屏取证
                              </div>
                           </div>
                           <ChevronRight size={16} className="text-slate-800 group-hover:text-cyan-500 transition-colors" />
                        </div>
                      ))}
                      {violations.length === 0 && (
                         <div className="h-56 flex flex-col items-center justify-center text-slate-700 italic opacity-40">
                            <RadarIcon size={48} className="mb-4 animate-pulse" />
                            <span className="text-[12px] font-black tracking-widest uppercase">雷达扫描就绪</span>
                         </div>
                      )}
                   </div>
                 )}

                 {activeTab === 'TOOLS' && (
                   <div className="grid grid-cols-2 gap-4">
                      <ToolCard icon={<Search size={22} />} title="全域检索" desc="知识库与话术矩阵" color="cyan" />
                      <ToolCard icon={<Video size={22} />} title="协同共享" desc="远程专家协同请求" color="amber" />
                      <ToolCard icon={<AlertCircle size={22} />} title="紧急求助" desc="触发人工指挥干预" color="red" />
                      <ToolCard icon={<Settings size={22} />} title="终端配置" desc="参数与识别精度调整" color="slate" />
                   </div>
                 )}
              </div>
              
              <div className="p-5 bg-black/60 border-t border-white/10 flex justify-between items-center px-10">
                 <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest">Link Active</span>
                 </div>
                 <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic">{CONFIG.APP_VERSION}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, title, color }: any) {
  const activeClassMap: any = {
    red: "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] border-red-400",
    emerald: "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] border-emerald-400",
    white: "bg-white text-black shadow-lg"
  }

  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border border-transparent",
        active ? activeClassMap[color] : "text-slate-500 hover:bg-white/10 hover:text-white"
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
        "flex-1 py-3.5 rounded-[20px] flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative overflow-hidden",
        isSelected ? "bg-white/10 text-cyan-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
      {isSelected && (
        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
      )}
    </button>
  )
}

function DetailCard({ label, value, isCyan, sub }: any) {
  return (
    <div className="bg-white/5 p-6 rounded-[28px] border border-white/5 group hover:border-white/10 transition-all">
       <div className="text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">{label}</div>
       <div className={cn("text-2xl font-black mb-0.5 tracking-tighter", isCyan ? "text-cyan-400" : "text-white")}>{value}</div>
       <div className="text-[8px] font-bold text-slate-600 uppercase italic opacity-50">{sub}</div>
    </div>
  )
}

function ToolCard({ icon, title, desc, color }: any) {
  const colors: any = {
    cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/15",
    amber: "text-amber-400 bg-amber-400/5 border-amber-400/15",
    red: "text-red-400 bg-red-400/5 border-red-400/15",
    slate: "text-slate-400 bg-white/5 border-white/10"
  }
  return (
    <button className={cn("p-6 rounded-[28px] border flex flex-col items-start gap-3.5 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group", colors[color])}>
       <div className="w-11 h-11 rounded-[18px] flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors shadow-inner">
          {icon}
       </div>
       <div>
          <div className="text-[14px] font-black text-white mb-0.5 uppercase tracking-tight">{title}</div>
          <div className="text-[10px] font-medium text-slate-500 leading-tight">{desc}</div>
       </div>
    </button>
  )
}