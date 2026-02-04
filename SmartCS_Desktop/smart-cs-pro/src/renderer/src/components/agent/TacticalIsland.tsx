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
    const width = 580
    const height = isExpanded ? 760 : 100
    window.electron.ipcRenderer.send('resize-window', { width, height })
    window.electron.ipcRenderer.send('set-always-on-top', true)
  }, [isExpanded])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-1 overflow-hidden pointer-events-none select-none">
      <motion.div 
        layout
        className={cn(
          "pointer-events-auto border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-500 rounded-[38px]",
          isGlassMode ? "bg-slate-950/60 backdrop-blur-2xl" : "bg-slate-950",
          isAlerting && "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] ring-1 ring-red-500/20"
        )}
      >
        {/* 1. 战术中枢条 (Main Bar) */}
        <div 
          className="flex items-center justify-between px-6 h-[88px] shrink-0 cursor-move" 
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {/* 左侧：用户信息 & 状态 */}
          <div className="flex items-center gap-4 min-w-[200px]">
            <div className="relative">
              <div className={cn(
                "w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-lg transition-all duration-500",
                isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-slate-900 text-slate-600 border border-white/5"
              )}>
                {user?.real_name ? user.real_name[0] : <UserIcon size={24} />}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border-[3px] border-slate-950 transition-all duration-500",
                isOnline ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-red-500 animate-pulse"
              )} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black text-white tracking-widest uppercase flex items-center gap-2">
                {user?.real_name || 'System Node'}
                {isOnboardingMode && <GraduationCap size={15} className="text-amber-400 animate-bounce" />}
              </span>
              <div className="flex items-center gap-2">
                 <span className={cn(
                   "text-[10px] font-bold uppercase tracking-widest transition-colors",
                   isOnline ? "text-emerald-500/80" : "text-red-500/80"
                 )}>
                   {isOnline ? 'Active Link' : 'Offline'}
                 </span>
              </div>
            </div>
          </div>

          {/* 中间：核心控制组 (全面切换为绿色激活态) */}
          <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <HubBtn 
              icon={isGlassMode ? <Ghost size={20} /> : <Square size={20} />} 
              active={!isGlassMode} 
              onClick={() => setGlassMode(!isGlassMode)}
              title={isGlassMode ? "切换实色" : "切换磨砂"}
            />
            <div className="w-px h-8 bg-white/5 mx-0.5" />
            <HubBtn 
              icon={<GraduationCap size={20} />} 
              active={isOnboardingMode} 
              onClick={() => setOnboardingMode(!isOnboardingMode)}
              title="培训模式"
            />
            <HubBtn 
              icon={<Sparkles size={20} />} 
              active={isAiOptimizeEnabled} 
              onClick={() => setAiOptimize(!isAiOptimizeEnabled)}
              title="AI 优化"
            />
            <HubBtn 
              icon={isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} 
              active={isMuted} 
              onClick={() => setMuted(!isMuted)}
              title="静音控制"
            />
            <HubBtn 
              icon={<LayoutGrid size={20} />} 
              active={isExpanded} 
              onClick={() => setIsExpanded(!isExpanded)} 
              title="看板"
            />
          </div>

          {/* 右侧：退出 (精简掉百分比) */}
          <div className="flex items-center justify-end min-w-[80px]" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button 
              onClick={() => { logout(); window.location.hash = '/login'; }}
              className="w-11 h-11 rounded-2xl bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all group border border-white/5 shadow-sm"
              title="断开连接"
            >
              <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
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
              <div className="flex p-3 bg-black/40 gap-3 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<Target size={18}/>} label="智脑核对" />
                 <TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={18}/>} label="全域雷达" />
                 <TabBtn id="TOOLS" active={activeTab} set={setActiveTab} icon={<Box size={18}/>} label="战术工具" />
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-8">
                      <div className="p-7 bg-cyan-500/5 border border-cyan-500/10 rounded-[32px] relative overflow-hidden group">
                         <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000">
                            <BrainCircuit size={180} />
                         </div>
                         <h4 className="text-[12px] font-black text-cyan-400 uppercase mb-4 flex items-center gap-3 tracking-widest">
                           <Terminal size={17} /> 智脑建议策略
                         </h4>
                         <p className="text-[16px] text-slate-100 leading-relaxed font-semibold italic">
                           {lastAiAnalysis?.strategy || "中枢神经链路正常，正在进行实时话术矩阵校验..."}
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <DetailCard label="风险值" value={`${lastAiAnalysis?.risk_score || 0}%`} sub="Real-time Risk" />
                         <DetailCard label="情感偏离" value={lastAiAnalysis?.sentiment_score || 0} isCyan sub="Sentiment Deviation" />
                      </div>
                   </div>
                 )}

                 {activeTab === 'RADAR' && (
                   <div className="space-y-4">
                      {violations.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-white/5 rounded-[32px] border border-white/5 hover:bg-white/10 transition-all group">
                           <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shadow-inner">
                              <AlertCircle size={24} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-black text-white truncate mb-1">{v.keyword}</div>
                              <div className="text-[11px] text-slate-500 font-mono uppercase flex items-center gap-2">
                                 <Monitor size={14} /> {new Date(v.timestamp).toLocaleTimeString()} · 已截屏取证
                              </div>
                           </div>
                           <ChevronRight size={18} className="text-slate-800 group-hover:text-cyan-500 transition-colors" />
                        </div>
                      ))}
                      {violations.length === 0 && (
                         <div className="h-56 flex flex-col items-center justify-center text-slate-700 italic">
                            <RadarIcon size={56} className="mb-6 opacity-10 animate-pulse" />
                            <span className="text-[13px] font-black tracking-[0.4em] uppercase opacity-40">雷达扫描就绪</span>
                         </div>
                      )}
                   </div>
                 )}

                 {activeTab === 'TOOLS' && (
                   <div className="grid grid-cols-2 gap-5">
                      <ToolCard icon={<Search size={26} />} title="全域检索" desc="知识库与话术矩阵" color="cyan" />
                      <ToolCard icon={<Video size={26} />} title="协同共享" desc="发起远程专家协同" color="amber" />
                      <ToolCard icon={<AlertCircle size={26} />} title="紧急求助" desc="触发人工指挥干预" color="red" />
                      <ToolCard icon={<Settings size={26} />} title="终端配置" desc="参数与识别精度调整" color="slate" />
                   </div>
                 )}
              </div>
              
              <div className="p-6 bg-black/60 border-t border-white/10 flex justify-between items-center px-10">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-black tracking-[0.2em]">Secure Connection Active</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">{CONFIG.APP_VERSION}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, title }: any) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border border-transparent shadow-sm",
        active 
          ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border-emerald-400" 
          : "text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/10"
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
        "flex-1 py-4 rounded-[22px] flex flex-col items-center justify-center gap-2 transition-all duration-500 relative overflow-hidden",
        isSelected ? "bg-white/10 text-cyan-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-[0.1em]">{label}</span>
      {isSelected && (
        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
      )}
    </button>
  )
}

function DetailCard({ label, value, isCyan, sub }: any) {
  return (
    <div className="bg-white/5 p-7 rounded-[32px] border border-white/5 group hover:border-white/10 transition-all">
       <div className="text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">{label}</div>
       <div className={cn("text-3xl font-black mb-1 tracking-tighter", isCyan ? "text-cyan-400" : "text-white")}>{value}</div>
       <div className="text-[9px] font-bold text-slate-600 uppercase italic opacity-60">{sub}</div>
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
    <button className={cn("p-7 rounded-[32px] border flex flex-col items-start gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group shadow-lg", colors[color])}>
       <div className="w-12 h-12 rounded-[20px] flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors shadow-inner">
          {icon}
       </div>
       <div>
          <div className="text-[15px] font-black text-white mb-1 uppercase tracking-tight">{title}</div>
          <div className="text-[11px] font-medium text-slate-500 leading-tight">{desc}</div>
       </div>
    </button>
  )
}