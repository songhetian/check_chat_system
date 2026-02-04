import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export const TacticalIsland = () => {
  const { 
    isAlerting, lastAiAnalysis, isOnline, violations, isMuted, setMuted,
    isOnboardingMode, setOnboardingMode, isAiOptimizeEnabled, setAiOptimize
  } = useRiskStore()
  const { user, logout } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')

  // 灵动岛尺寸动态适配：增加高度以确保显示效果
  useEffect(() => {
    const width = 580 // 稍微加宽以容纳更多按钮
    const height = isExpanded ? 680 : 80 // 增加高度，避免内容局促
    window.electron.ipcRenderer.send('resize-window', { width, height })
    window.electron.ipcRenderer.send('set-always-on-top', true)
  }, [isExpanded])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden pointer-events-none select-none">
      <motion.div 
        layout
        className={cn(
          "pointer-events-auto bg-slate-950/95 border border-white/10 backdrop-blur-3xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden transition-all duration-500 rounded-[32px]",
          isAlerting && "border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] ring-2 ring-red-500/20"
        )}
      >
        {/* 1. 战术中枢条 (Main Bar) */}
        <div 
          className="flex items-center justify-between px-5 h-[80px] shrink-0 cursor-move" 
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {/* 左侧：用户信息 & 状态 */}
          <div className="flex items-center gap-4 min-w-[180px]">
            <div className="relative">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500",
                isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-slate-900 text-slate-600 border border-white/5"
              )}>
                {user?.real_name ? user.real_name[0] : <UserIcon size={24} />}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 transition-all duration-500",
                isOnline ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-red-500 animate-pulse"
              )} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black text-white tracking-widest uppercase flex items-center gap-2">
                {user?.real_name || 'System Node'}
                {isOnboardingMode && <GraduationCap size={14} className="text-amber-400 animate-bounce" />}
              </span>
              <div className="flex items-center gap-2">
                 <span className={cn(
                   "text-[9px] font-bold uppercase tracking-tighter transition-colors",
                   isOnline ? "text-emerald-500/80" : "text-red-500/80"
                 )}>
                   {isOnline ? 'Tactical Link: Online' : 'Link Offline'}
                 </span>
              </div>
            </div>
          </div>

          {/* 中间：核心控制组 (开关与功能图标) */}
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <HubBtn 
              icon={<GraduationCap size={20} />} 
              active={isOnboardingMode} 
              onClick={() => setOnboardingMode(!isOnboardingMode)}
              title="培训引导模式"
              color="amber"
            />
            <HubBtn 
              icon={<Sparkles size={20} />} 
              active={isAiOptimizeEnabled} 
              onClick={() => setAiOptimize(!isAiOptimizeEnabled)}
              title="智能输入优化"
              color="cyan"
            />
            <div className="w-px h-8 bg-white/5 mx-1" />
            <HubBtn 
              icon={isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} 
              active={isMuted} 
              isRed={isMuted}
              onClick={() => setMuted(!isMuted)}
              title="系统静音控制"
            />
            <HubBtn 
              icon={<LayoutGrid size={20} />} 
              active={isExpanded} 
              onClick={() => setIsExpanded(!isExpanded)} 
              title="战术看板"
            />
          </div>

          {/* 右侧：风险动态 & 退出 */}
          <div className="flex items-center gap-4 min-w-[140px] justify-end" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk Index</span>
               <div className="flex items-center gap-2">
                  <span className={cn("text-[16px] font-mono font-black transition-colors", isAlerting ? "text-red-500 animate-pulse" : "text-cyan-400")}>
                    {lastAiAnalysis?.risk_score || 0}%
                  </span>
                  {isAlerting && <AlertCircle size={14} className="text-red-500" />}
               </div>
            </div>
            <button 
              onClick={() => { logout(); window.location.hash = '/login'; }}
              className="w-10 h-10 rounded-xl bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all group"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
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
              className="flex-1 flex flex-col overflow-hidden border-t border-white/5 bg-gradient-to-b from-transparent to-black/40"
            >
              {/* 导航面板 */}
              <div className="flex p-3 bg-black/60 gap-3 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<Target size={18}/>} label="智脑核对" />
                 <TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={18}/>} label="全域雷达" />
                 <TabBtn id="TOOLS" active={activeTab} set={setActiveTab} icon={<Box size={18}/>} label="战术工具" />
              </div>

              {/* 内容区域 */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-8">
                      <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-[28px] relative overflow-hidden group">
                         <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-1000">
                            <BrainCircuit size={160} />
                         </div>
                         <h4 className="text-[12px] font-black text-cyan-400 uppercase mb-4 flex items-center gap-3 tracking-widest">
                           <Terminal size={16} /> 智脑实时干预策略
                         </h4>
                         <p className="text-[16px] text-slate-100 leading-relaxed font-medium">
                           {lastAiAnalysis?.strategy || "中枢神经链路已激活，正在进行全量语义脱敏核对..."}
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                         <DetailCard label="风险评估值" value={`${lastAiAnalysis?.risk_score || 0}%`} sub="Real-time Score" />
                         <DetailCard label="对话情感偏移" value={lastAiAnalysis?.sentiment_score || 0} isCyan sub="Sentiment Pulse" />
                      </div>
                   </div>
                 )}

                 {activeTab === 'RADAR' && (
                   <div className="space-y-4">
                      <div className="flex justify-between items-center px-2 mb-2">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">物理层拦截取证 (实时)</span>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      </div>
                      {violations.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center gap-5 p-5 bg-white/5 rounded-[24px] border border-white/5 hover:bg-white/10 transition-all group">
                           <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                              <AlertCircle size={24} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-bold text-white truncate mb-1">{v.keyword}</div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase flex items-center gap-2">
                                 <Monitor size={12} /> {new Date(v.timestamp).toLocaleTimeString()} · 已自动保存截屏取证
                              </div>
                           </div>
                           <ChevronRight size={18} className="text-slate-800 group-hover:text-cyan-500 transition-colors" />
                        </div>
                      ))}
                      {violations.length === 0 && (
                         <div className="h-48 flex flex-col items-center justify-center text-slate-700 italic">
                            <RadarIcon size={48} className="mb-4 opacity-10 animate-pulse" />
                            <span className="text-[12px] font-black tracking-[0.3em] uppercase opacity-40">物理拦截雷达扫描中...</span>
                         </div>
                      )}
                   </div>
                 )}

                 {activeTab === 'TOOLS' && (
                   <div className="grid grid-cols-2 gap-5">
                      <ToolCard 
                        icon={<Search size={24} />} 
                        title="全域战术检索" 
                        desc="检索知识库、SOP与话术矩阵"
                        color="cyan"
                      />
                      <ToolCard 
                        icon={<Video size={24} />} 
                        title="屏幕实时共享" 
                        desc="向指挥中心发起远程协同请求"
                        color="amber"
                      />
                      <ToolCard 
                        icon={<AlertCircle size={24} />} 
                        title="紧急风险求助" 
                        desc="一键触发人工干预与现场指导"
                        color="red"
                      />
                      <ToolCard 
                        icon={<Settings size={24} />} 
                        title="终端环境配置" 
                        desc="调整 OCR 识别精度与自愈参数"
                        color="slate"
                      />
                   </div>
                 )}
              </div>
              
              <div className="p-5 bg-black/60 border-t border-white/5 flex justify-between items-center px-8">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-[0.2em]">Link Secure · Anti-Tamper Enabled</span>
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
        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90",
        active 
          ? (isRed ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white text-black shadow-lg shadow-white/10") 
          : `${colorMap[color]} hover:bg-white/15 hover:text-white`
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
        "flex-1 py-4 rounded-[20px] flex flex-col items-center justify-center gap-2 transition-all duration-500 relative overflow-hidden",
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
    <div className="bg-white/5 p-6 rounded-[28px] border border-white/5 group hover:border-white/10 transition-all">
       <div className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{label}</div>
       <div className={cn("text-3xl font-black mb-1", isCyan ? "text-cyan-400" : "text-white")}>{value}</div>
       <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter italic">{sub}</div>
    </div>
  )
}

function ToolCard({ icon, title, desc, color }: any) {
  const colors: any = {
    cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/20",
    amber: "text-amber-400 bg-amber-400/5 border-amber-400/20",
    red: "text-red-400 bg-red-400/5 border-red-400/20",
    slate: "text-slate-400 bg-white/5 border-white/10"
  }
  return (
    <button className={cn("p-6 rounded-[28px] border flex flex-col items-start gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group", colors[color])}>
       <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
          {icon}
       </div>
       <div>
          <div className="text-sm font-black text-white mb-1 uppercase tracking-tight">{title}</div>
          <div className="text-[11px] font-medium text-slate-500 leading-tight">{desc}</div>
       </div>
    </button>
  )
}
