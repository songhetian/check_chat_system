import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban, Undo2,
  UserSearch, Layers, Star, Info, Link2, ScanEye, Crosshair, HelpCircle, ChevronsLeft, ChevronsRight
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn, tacticalRequest } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export const TacticalIsland = () => {
  const { 
    isAlerting, isOnline, violations, isGlassMode, setGlassMode,
    layoutMode, setLayoutMode, activeSideTool, setActiveSideTool,
    isCustomerHudEnabled, setCustomerHudEnabled, currentCustomer, setCurrentCustomer,
    isOnboardingMode, setOnboardingMode, isMuted, setMuted
  } = useRiskStore()
  
  const { user, logout } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFolded, setIsFolded] = useState(false) 
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)
  const [showCalibration, setShowCalibration] = useState(false)
  
  const [searchQuery, setSearchText] = useState('')
  const [filterPrice, setFilterPrice] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const [helpText, setHelpText] = useState('')
  const [showCriticalAlert, setShowCriticalAlert] = useState(false)

  useEffect(() => {
    const screenWidth = window.screen.availWidth
    const screenHeight = window.screen.availHeight
    
    // 物理宽度：展开态压减至 660px，折叠态保持 80px
    let width = isFolded ? 80 : 660 
    let height = showHelpModal ? 480 : (isExpanded ? 564 : 72)
    let x: number | undefined = undefined
    let y: number | undefined = undefined
    let center = false

    if (showBigScreenModal) {
      width = 1280; height = 850; center = true
    } else if (layoutMode === 'SIDE') {
      width = 440; height = screenHeight - 80; x = screenWidth - 460; y = 40
    } else {
      x = isFolded ? screenWidth - 100 : screenWidth - 680
      y = 30
    }
    window.electron.ipcRenderer.send('resize-window', { width, height, center, x, y })
    window.electron.ipcRenderer.send('set-always-on-top', !showBigScreenModal)
  }, [isExpanded, showHelpModal, showBigScreenModal, layoutMode, isFolded])

  const executeSearch = async () => {
    const apiType = activeSideTool === 'PRODUCTS' ? 'products' : 'violations'; 
    let url = `${CONFIG.API_BASE}/admin/${apiType}?keyword=${searchQuery}&size=15`;
    const res = await tacticalRequest({ url, method: 'GET', headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` } });
    if (res.status === 200) setSearchResults(res.data.data);
  }

  const handleHelp = async (type: 'TEXT' | 'IMAGE') => {
    let payload: any = { type: 'EMERGENCY_HELP', subType: type }
    window.dispatchEvent(new CustomEvent('send-risk-msg', { detail: payload }))
    setShowHelpModal(false); setHelpText('')
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none bg-transparent text-black">
      <AnimatePresence>
        {showCriticalAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none bg-red-600/20 backdrop-blur-2xl">
             <div className="p-16 rounded-xl bg-black/40 border-2 border-red-500 shadow-2xl">
                <AlertOctagon size={140} className="text-red-500 animate-pulse mx-auto mb-8" />
                <div className="text-center space-y-4">
                   <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase text-center">智脑战术警告</h2>
                   <p className="text-2xl font-black text-red-400 uppercase tracking-[0.4em] text-center">检测到客户态度极其恶劣 · 请立即启用危机公关话术</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout
        initial={false}
        animate={{ 
          width: layoutMode === 'SIDE' ? 440 : (showBigScreenModal ? 1280 : (isFolded ? 80 : 660)),
          height: layoutMode === 'SIDE' ? 850 : (showBigScreenModal ? 850 : (showHelpModal ? 480 : (isExpanded ? 564 : 72)))
        }}
        className={cn(
          "pointer-events-auto border border-white/10 flex flex-col overflow-hidden transition-all duration-500 relative",
          isGlassMode ? "bg-slate-950/60 backdrop-blur-2xl shadow-none" : "bg-slate-950 shadow-none",
          (showBigScreenModal || layoutMode === 'SIDE') ? "rounded-none" : "rounded-2xl"
        )}
        style={{ backfaceVisibility: 'hidden', transform: 'translate3d(0,0,0)' } as any}
      >
        {layoutMode === 'FLOAT' && (
          <div className="flex items-center px-4 h-[72px] shrink-0 cursor-move relative" style={{ WebkitAppRegion: 'drag' } as any}>
            
            <AnimatePresence>
              {!isFolded && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 w-[110px] shrink-0">
                  <div className="relative">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-white", isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-600 border border-white/5")}>{user?.real_name ? user.real_name[0] : <UserIcon size={18} />}</div>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-slate-950", isOnline ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-black text-white truncate leading-none mb-0.5">{user?.real_name || '成员'}</span>
                    <span className={cn("text-[8px] font-bold uppercase tracking-widest truncate", isOnline ? "text-emerald-500" : "text-red-500")}>{isOnline ? '在线' : '离线'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 flex items-center justify-end pr-2 gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <AnimatePresence>
                {!isFolded && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center justify-center gap-2">
                    <HubBtn icon={<Ghost size={20} />} active={!isGlassMode} onClick={() => setGlassMode(!isGlassMode)} title="外观" color="muted" />
                    <HubBtn icon={<GraduationCap size={20} />} active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} title="培训" color="emerald" />
                    <HubBtn icon={isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} active={isMuted} onClick={() => setMuted(!isMuted)} title={isMuted ? "解禁" : "静音"} color={isMuted ? "red" : "muted"} />
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <HubBtn icon={<Package size={20} />} active={activeSideTool === 'PRODUCTS'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('PRODUCTS' as any); }} title="资料" color="white" />
                    <HubBtn icon={<BookOpen size={20} />} active={activeSideTool === 'KNOWLEDGE'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('KNOWLEDGE' as any); }} title="手册" color="white" />
                    <HubBtn icon={<Tags size={20} />} active={isCustomerHudEnabled} onClick={() => setCustomerHudEnabled(!isCustomerHudEnabled)} title="画像" color={isCustomerHudEnabled ? "emerald" : "white"} />
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <HubBtn icon={<Globe size={20} />} active={showBigScreenModal} onClick={() => setShowBigScreenModal(!showBigScreenModal)} title="全景" color="emerald" />
                    <HubBtn icon={<Hand size={20} />} active={showHelpModal} onClick={() => setShowHelpModal(!showHelpModal)} title="求助" color="red" />
                    <HubBtn icon={<LayoutGrid size={20} />} active={isExpanded} onClick={() => setIsExpanded(!isExpanded)} title="面板" color="muted" />
                    <HubBtn icon={<LogOut size={20} />} active={false} onClick={() => { logout(); window.location.hash = '/login'; }} title="退出" color="red" />
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>

              <HubBtn 
                icon={isFolded ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />} 
                active={isFolded} 
                onClick={() => setIsFolded(!isFolded)} 
                title={isFolded ? "展开" : "收起"} 
                color="muted" 
              />
            </div>
          </div>
        )}

        {layoutMode === 'SIDE' && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <div className="p-6 bg-cyan-600 text-white flex justify-between items-center shrink-0">
                <button onClick={() => { setLayoutMode('FLOAT'); setActiveSideTool(null); setIsExpanded(false); }} className="px-4 py-2 bg-black/20 hover:bg-black/40 rounded-xl flex items-center gap-2 font-black text-xs transition-all shadow-inner"><Undo2 size={16}/> 返回</button>
                <h4 className="text-lg font-black italic tracking-tighter uppercase">{activeSideTool === 'PRODUCTS' ? '商品资产' : (activeSideTool === 'KNOWLEDGE' ? '知识矩阵' : '客户洞察')}</h4>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4 text-white">
                   {searchResults.map((item, i) => (
                     <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                       <div className="text-base font-black mb-2 italic">{item.name || item.keyword}</div>
                       <div className="p-3 bg-black/60 rounded-xl text-xs text-slate-200 border border-white/5 leading-relaxed">"{item.usp || item.solution}"</div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        <AnimatePresence>
          {isExpanded && layoutMode === 'FLOAT' && (
            <motion.div initial={{ height: 0 }} animate={{ height: 500 }} exit={{ height: 0 }} className="flex-1 flex flex-col border-t border-white/5 bg-slate-950">
              <div className="flex p-2 gap-2 bg-black/40">
                 <TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<Target size={16}/>} label="智脑" />
                 <TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={16}/>} label="雷达" />
                 <TabBtn id="TOOLS" active={activeTab} set={setActiveTab} icon={<Box size={16}/>} label="工具" />
              </div>
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                 <div className="p-10 text-center opacity-20 italic text-white text-xs">智脑对策逻辑已集成</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, title, color }: any) {
  const activeClassMap: any = { red: "bg-red-500 text-white", emerald: "bg-emerald-500 text-white", white: "bg-white text-black", muted: "bg-slate-800 text-white" }
  return (
    <div className="relative group/btn">
      <button onClick={onClick} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 overflow-hidden relative", active ? activeClassMap[color] : "text-slate-500 hover:bg-white/10 hover:text-white")}>
        <div className="transition-all duration-300 group-hover/btn:opacity-0 group-hover/btn:scale-50">
          {icon}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-all duration-300 translate-y-2 group-hover/btn:translate-y-0">
          <span className="text-[10px] font-black text-white uppercase tracking-tighter">{title}</span>
        </div>
      </button>
    </div>
  )
}

function TabBtn({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (<button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all relative", isSelected ? "bg-white/10 text-cyan-400" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase">{label}</span>{isSelected && (<motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />)}</button>)
}

function InsightCard({ title, desc, color, icon }: any) {
  const colors: any = { emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", red: "bg-red-500/10 border-red-500/20 text-red-400", cyan: "bg-cyan-500/10 border-cyan-400/15 text-cyan-400" }
  return (<div className={cn("p-4 rounded-xl border flex gap-3 transition-all hover:bg-white/5", colors[color])}><div className="shrink-0 mt-1 text-white">{icon}</div><div><p className="text-xs font-black mb-1 text-white">{title}</p><p className="text-[10px] font-medium leading-relaxed opacity-80 text-white">{desc}</p></div></div>)
}

function ToolCard({ icon, title, desc, color, onClick }: any) {
  const colors: any = { cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/15", amber: "text-amber-400 bg-amber-400/5 border-amber-400/15", red: "text-red-400 bg-red-400/5 border-red-400/15", slate: "text-slate-400 bg-white/5 border-white/10" }
  return (<button onClick={onClick} className={cn("p-4 rounded-xl border flex flex-col gap-2 transition-all hover:scale-[1.02] text-left", colors[color])}><div className="w-8 h-8 rounded-xl flex items-center justify-center bg-black/30 shadow-inner">{icon}</div><div><div className="text-xs font-black uppercase mb-0.5">{title}</div><div className="text-[9px] opacity-60 leading-tight">{desc}</div></div></button>)
}
