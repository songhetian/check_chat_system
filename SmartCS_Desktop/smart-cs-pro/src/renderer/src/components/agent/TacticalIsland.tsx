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
    const width = 620
    const height = isExpanded ? 760 : 110
    window.electron.ipcRenderer.send('resize-window', { width, height })
    window.electron.ipcRenderer.send('set-always-on-top', true)
  }, [isExpanded])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-2 overflow-hidden pointer-events-none select-none">
      <motion.div 
        layout
        className={cn(
          "pointer-events-auto border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,1)] flex flex-col overflow-hidden transition-all duration-500 rounded-[40px]",
          isGlassMode ? "bg-slate-950/98 backdrop-blur-3xl" : "bg-slate-950",
          isAlerting && "border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.6)] ring-2 ring-red-500/20"
        )}
      >
        {/* 1. 战术中枢条 (Main Bar) */}
        <div 
          className="flex items-center justify-between px-7 h-[96px] shrink-0 cursor-move" 
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {/* 左侧：用户信息 & 状态 */}
          <div className="flex items-center gap-5 min-w-[200px]">
            <div className="relative">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-500",
                isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : "bg-slate-900 text-slate-600 border border-white/5"
              )}>
                {user?.real_name ? user.real_name[0] : <UserIcon size={28} />}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-slate-950 transition-all duration-500",
                isOnline ? "bg-emerald-500 shadow-[0_0_12px_#10b981]" : "bg-red-500 animate-pulse"
              )} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-black text-white tracking-widest uppercase flex items-center gap-2">
                {user?.real_name || 'System Node'}
                {isOnboardingMode && <GraduationCap size={16} className="text-amber-400 animate-bounce" />}
              </span>
              <div className="flex items-center gap-2">
                 <span className={cn(
                   "text-[10px] font-bold uppercase tracking-widest transition-colors opacity-70",
                   isOnline ? "text-emerald-500" : "text-red-500"
                 )}>
                   {isOnline ? 'Tactical Link: Online' : 'Link Offline'}
                 </span>
              </div>
            </div>
          </div>

          {/* 中间：核心控制组 */}
          <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <HubBtn 
              icon={isGlassMode ? <Ghost size={22} /> : <Square size={22} />} 
              active={!isGlassMode} 
              onClick={() => setGlassMode(!isGlassMode)}
              title={isGlassMode ? "切换至实色背景" : "切换至磨砂玻璃"}
              color="white"
            />
            <div className="w-px h-10 bg-white/10 mx-1" />
            <HubBtn 
              icon={<GraduationCap size={22} />} 
              active={isOnboardingMode} 
              onClick={() => setOnboardingMode(!isOnboardingMode)}
              title="培训引导模式"
              color="amber"
            />
            <HubBtn 
              icon={<Sparkles size={22} />} 
              active={isAiOptimizeEnabled} 
              onClick={() => setAiOptimize(!isAiOptimizeEnabled)}
              title="智能输入优化"
              color="cyan"
            />
            <HubBtn 
              icon={isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />} 
              active={isMuted} 
              isRed={isMuted}
              onClick={() => setMuted(!isMuted)}
              title="系统静音控制"
            />
            <HubBtn 
              icon={<LayoutGrid size={22} />} 
              active={isExpanded} 
              onClick={() => setIsExpanded(!isExpanded)} 
              title="战术看板"
            />
          </div>

          {/* 右侧：风险动态 & 退出 */}
          <div className="flex items-center gap-5 min-w-[150px] justify-end" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="flex flex-col items-end mr-1">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Index</span>
               <div className="flex items-center gap-2">
                  <span className={cn("text-xl font-mono font-black transition-colors", isAlerting ? "text-red-500 animate-pulse" : "text-cyan-400")}>
                    {lastAiAnalysis?.risk_score || 0}%
                  </span>
                  {isAlerting && <AlertCircle size={16} className="text-red-500" />}
               </div>
            </div>
            <button 
              onClick={() => { logout(); window.location.hash = '/login'; }}
              className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all group border border-white/5 shadow-xl"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
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
              className="flex-1 flex flex-col overflow-hidden border-t border-white/10 bg-gradient-to-b from-black/20 to-black/60"
            >
              {/* 导航面板 */}
              <div className="flex p-4 bg-black/40 gap-4 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<Target size={20}/>} label="智脑核对" />
                 <TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={20}/>} label="全域雷达" />
                 <TabBtn id="TOOLS" active={activeTab} set={setActiveTab} icon={<Box size={20}/>} label="战术工具" />
              </div>

              {/* 内容区域 */}
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-10">
                      <div className="p-8 bg-cyan-500/5 border border-cyan-500/10 rounded-[32px] relative overflow-hidden group">
                         <div className="absolute -top-10 -right-10 p-4 opacity-[0.04] group-hover:opacity-[0.1] transition-all duration-1000">
                            <BrainCircuit size={200} />
                         </div>
                         <h4 className="text-[13px] font-black text-cyan-400 uppercase mb-5 flex items-center gap-3 tracking-widest">
                           <Terminal size={18} /> 智脑实时干预建议
                         </h4>
                         <p className="text-[17px] text-slate-100 leading-relaxed font-semibold">
                           {lastAiAnalysis?.strategy || "中枢神经链路已激活，正在进行全量语义脱敏核对..."}
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <DetailCard label="全域风险评估" value={`${lastAiAnalysis?.risk_score || 0}%`} sub="Tactical Score Pulse" />
                         <DetailCard label="对话情感偏移" value={lastAiAnalysis?.sentiment_score || 0} isCyan sub="Sentiment Deviation" />
                      </div>
                   </div>
                 )}

                 {activeTab === 'RADAR' && (
                   <div className="space-y-5">
                      <div className="flex justify-between items-center px-4 mb-3">
                        <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">物理层拦截取证 (实时监听)</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_#ef4444]" />
                      </div>
                      {violations.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-white/5 rounded-[32px] border border-white/5 hover:bg-white/10 hover:border-red-500/30 transition-all group cursor-default">
                           <div className="w-14 h-14 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shadow-inner">
                              <AlertCircle size={28} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-[15px] font-black text-white truncate mb-1">{v.keyword}</div>
                              <div className="text-[11px] text-slate-500 font-mono uppercase flex items-center gap-2 opacity-60">
                                 <Monitor size={14} /> {new Date(v.timestamp).toLocaleTimeString()} · 已自动固化截屏取证
                              </div>
                           </div>
                           <ChevronRight size={20} className="text-slate-800 group-hover:text-cyan-500 transition-colors" />
                        </div>
                      ))}
                      {violations.length === 0 && (
                         <div className="h-60 flex flex-col items-center justify-center text-slate-700 italic">
                            <RadarIcon size={64} className="mb-6 opacity-10 animate-pulse" />
                            <span className="text-[13px] font-black tracking-[0.4em] uppercase opacity-40">物理拦截雷达扫描中...</span>
                         </div>
                      )}
                   </div>
                 )}

                 {activeTab === 'TOOLS' && (
                   <div className="grid grid-cols-2 gap-6">
                      <ToolCard 
                        icon={<Search size={28} />} 
                        title="全域战术检索" 
                        desc="检索知识库、SOP与话术矩阵"
                        color="cyan"
                      />
                      <ToolCard 
                        icon={<Video size={28} />} 
                        title="屏幕实时共享" 
                        desc="向指挥中心发起远程协同请求"
                        color="amber"
                      />
                      <ToolCard 
                        icon={<AlertCircle size={28} />} 
                        title="紧急风险求助" 
                        desc="一键触发人工干预与现场指导"
                        color="red"
                      />
                      <ToolCard 
                        icon={<Settings size={28} />} 
                        title="终端环境配置" 
                        desc="调整 OCR 识别精度与自愈参数"
                        color="slate"
                      />
                   </div>
                 )}
              </div>
              
              {/* 底部页脚 */}
              <div className="p-6 bg-black/60 border-t border-white/10 flex justify-between items-center px-10">
                 <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                    <div className="flex flex-col">
                       <span className="text-[11px] font-mono text-emerald-500/80 uppercase font-black tracking-[0.2em]">Link Protocol: SECURE</span>
                       <span className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">AES-256 E2E Encryption Active</span>
                    </div>
                 </div>
                 <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest italic">{CONFIG.APP_VERSION}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, isRed, title, color = 'white' }: any) {
  const colorMap: any = {
    cyan: "text-cyan-400 bg-cyan-400/10",
    amber: "text-amber-400 bg-amber-400/10",
    red: "text-red-400 bg-red-400/10",
    white: "text-slate-400 bg-white/5"
  }
  
  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border border-transparent shadow-md",
        active 
          ? (isRed ? "bg-red-500 text-white shadow-red-500/30 border-red-400" : "bg-white text-black shadow-white/20") 
          : `${colorMap[color]} hover:bg-white/15 hover:text-white hover:border-white/10`
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
        "flex-1 py-5 rounded-[24px] flex flex-col items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden",
        isSelected ? "bg-white/10 text-cyan-400 shadow-inner" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
      {isSelected && (
        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1.5 bg-cyan-500 shadow-[0_0_15px_#06b6d4]" />
      )}
    </button>
  )
}

function DetailCard({ label, value, isCyan, sub }: any) {
  return (
    <div className="bg-white/5 p-8 rounded-[36px] border border-white/5 group hover:border-white/10 transition-all shadow-lg">
       <div className="text-[11px] font-black text-slate-500 uppercase mb-3 tracking-widest">{label}</div>
       <div className={cn("text-4xl font-black mb-2 tracking-tighter", isCyan ? "text-cyan-400" : "text-white")}>{value}</div>
       <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter italic opacity-60">{sub}</div>
    </div>
  )
}

function ToolCard({ icon, title, desc, color }: any) {
  const colors: any = {
    cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/20 shadow-cyan-400/5",
    amber: "text-amber-400 bg-amber-400/5 border-amber-400/20 shadow-amber-400/5",
    red: "text-red-400 bg-red-400/5 border-red-400/20 shadow-red-400/5",
    slate: "text-slate-400 bg-white/5 border-white/10 shadow-black/20"
  }
  return (
    <button className={cn("p-8 rounded-[36px] border flex flex-col items-start gap-5 transition-all hover:scale-[1.03] active:scale-[0.97] text-left group shadow-xl", colors[color])}>
       <div className="w-14 h-14 rounded-[22px] flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors shadow-inner">
          {icon}
       </div>
       <div>
          <div className="text-[16px] font-black text-white mb-2 uppercase tracking-tight">{title}</div>
          <div className="text-[12px] font-medium text-slate-500 leading-snug">{desc}</div>
       </div>
    </button>
  )
}
