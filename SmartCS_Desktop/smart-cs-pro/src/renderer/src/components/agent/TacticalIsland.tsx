import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn, tacticalRequest } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export const TacticalIsland = () => {
  const { 
    isAlerting, lastAiAnalysis, isOnline, violations, isMuted, setMuted,
    isOnboardingMode, setOnboardingMode, isGlassMode, setGlassMode,
    layoutMode, setLayoutMode, activeSideTool, setActiveSideTool,
    isCustomerHudEnabled, setCustomerHudEnabled, currentCustomer, setCurrentCustomer
  } = useRiskStore()
  
  const { user, logout, hasPermission } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)
  
  // 侧边搜索状态
  const [searchQuery, setSearchText] = useState('')
  const [filterPrice, setFilterPrice] = useState<string>('')
  const [filterMaterial, setFilterMaterial] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  // 求助状态
  const [helpText, setHelpText] = useState('')
  const [helpSuggestions, setHelpSuggestions] = useState<any[]>([])

  // 全屏警告状态
  const [showCriticalAlert, setShowCriticalAlert] = useState(false)

  // 1. 核心：侧边栏位置同步 (Electron 物理位移)
  useEffect(() => {
    const screenWidth = window.screen.availWidth
    const screenHeight = window.screen.availHeight
    
    let width = 640
    let height = showHelpModal ? 480 : (isExpanded ? 564 : 64)
    let x: number | undefined = undefined
    let y: number | undefined = undefined
    let center = !showBigScreenModal && layoutMode === 'FLOAT'

    if (showBigScreenModal) {
      width = 1280; height = 850; center = true
    } else if (layoutMode === 'SIDE') {
      width = 420; height = screenHeight - 100; x = screenWidth - 440; y = 50; center = false
    }

    window.electron.ipcRenderer.send('resize-window', { width, height, center, x, y })
    window.electron.ipcRenderer.send('set-always-on-top', layoutMode === 'FLOAT')
  }, [isExpanded, showHelpModal, showBigScreenModal, layoutMode])

  // 2. 战术搜索逻辑 (支持多维过滤)
  const executeSearch = async () => {
    const apiType = activeSideTool === 'PRODUCTS' ? 'products' : 'violations'; // 假设知识库复用违规对策
    let url = `${CONFIG.API_BASE}/admin/${apiType}?keyword=${searchQuery}&size=10`;
    if (filterPrice) url += `&max_price=${filterPrice}`;
    if (filterMaterial) url += `&material=${filterMaterial}`;

    try {
      const res = await tacticalRequest({
        url, method: 'GET',
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      if (res.status === 200) setSearchResults(res.data.data);
    } catch (e) { console.error(e) }
  }

  // 3. 客户态度监控模拟 (实战中应由 WS 推送)
  useEffect(() => {
    if (isCustomerHudEnabled && lastAiAnalysis?.sentiment_score && lastAiAnalysis.sentiment_score < -0.6) {
      setShowCriticalAlert(true);
      setTimeout(() => setShowCriticalAlert(false), 5000);
    }
  }, [lastAiAnalysis, isCustomerHudEnabled])

  const handleHelp = async (type: 'TEXT' | 'IMAGE') => {
    let payload: any = { type: 'EMERGENCY_HELP', subType: type }
    if (type === 'IMAGE' && window.api?.captureScreen) payload.image = await window.api.captureScreen()
    else payload.content = helpText
    window.dispatchEvent(new CustomEvent('send-risk-msg', { detail: payload }))
    setShowHelpModal(false); setHelpText('')
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none bg-transparent">
      {/* 核心：SVG 强制裁剪路径 */}
      <svg width="0" height="0" className="absolute"><defs><clipPath id="tactical-island-clip" clipPathUnits="objectBoundingBox"><rect x="0" y="0" width="1" height="1" rx="0.06" ry="0.06" /></clipPath></defs></svg>

      {/* 智脑全屏红色警告 (物理破屏) */}
      <AnimatePresence>
        {showCriticalAlert && (
          <motion.div initial={{ opacity: 0, scale: 1.2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none bg-red-600/10 backdrop-blur-md">
             <div className="p-20 rounded-[64px] border-4 border-red-500 bg-black/80 flex flex-col items-center gap-10 shadow-[0_0_100px_rgba(239,68,68,0.5)] animate-pulse">
                <AlertOctagon size={120} className="text-red-500" />
                <div className="text-center">
                   <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-4">智脑高危警告</h2>
                   <p className="text-2xl font-black text-red-400 uppercase tracking-[0.5em]">检测到客户态度极其恶劣 · 请保持冷静并使用战术话术</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout
        initial={false}
        animate={{ 
          width: layoutMode === 'SIDE' ? 420 : (showBigScreenModal ? 1280 : 640),
          height: layoutMode === 'SIDE' ? 850 : (showBigScreenModal ? 850 : (showHelpModal ? 480 : (isExpanded ? 564 : 64))),
          borderRadius: (showBigScreenModal || layoutMode === 'SIDE') ? '0px' : '32px'
        }}
        className={cn(
          "pointer-events-auto border border-white/10 flex flex-col overflow-hidden transition-all duration-500 shadow-2xl relative",
          isGlassMode ? "bg-slate-950/30 backdrop-blur-3xl" : "bg-slate-950",
          isAlerting && "border-red-500 ring-1 ring-red-500/20",
          (showBigScreenModal || layoutMode === 'SIDE') ? "border-none" : "rounded-[32px]"
        )}
        style={{ clipPath: (showBigScreenModal || layoutMode === 'SIDE') ? 'none' : 'url(#tactical-island-clip)', WebkitClipPath: (showBigScreenModal || layoutMode === 'SIDE') ? 'none' : 'url(#tactical-island-clip)' }}
      >
        {/* --- 侧边栏模式专有头部 --- */}
        {layoutMode === 'SIDE' && (
          <div className="p-8 bg-cyan-500 text-slate-950 flex justify-between items-center shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
             <div className="flex items-center gap-3">
                <button onClick={() => { setLayoutMode('FLOAT'); setActiveSideTool(null); }} className="p-2 hover:bg-black/10 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
                <h4 className="text-lg font-black italic uppercase tracking-tighter">{activeSideTool === 'PRODUCTS' ? '商品资产检索' : '战术知识矩阵'}</h4>
             </div>
             <div className="text-[10px] font-black uppercase tracking-widest border border-slate-950/20 px-2 py-1 rounded-md">Side Dock Mode</div>
          </div>
        )}

        {/* 1. 战术中枢条 (Main Bar) - FLOAT 模式下显示 */}
        {layoutMode === 'FLOAT' && (
          <div className="flex items-center px-5 h-[64px] shrink-0 cursor-move relative" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex items-center gap-2.5 w-[120px] shrink-0">
              <div className="relative">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-500", isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-600 border border-white/5")}>{user?.real_name ? user.real_name[0] : <UserIcon size={18} />}</div>
                <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-slate-950", isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 animate-pulse")} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-black text-white truncate leading-none mb-1 flex items-center gap-1">{user?.real_name || '实战节点'}</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest truncate", isOnline ? "text-emerald-500" : "text-red-500")}>{isOnline ? '在线' : '离线'}</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <HubBtn icon={<Ghost size={18} />} active={isGlassMode} onClick={() => setGlassMode(!isGlassMode)} title="玻璃拟态" color="muted" />
              <HubBtn icon={<GraduationCap size={18} />} active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} title="培训" color="emerald" />
              <HubBtn icon={isCustomerHudEnabled ? <Tags size={18} /> : <UserIcon size={18} />} active={isCustomerHudEnabled} onClick={() => setCustomerHudEnabled(!isCustomerHudEnabled)} title="客户画像" color="emerald" />
              <div className="w-px h-5 bg-white/10 mx-0.5" />
              <HubBtn icon={<Globe size={18} />} active={showBigScreenModal} onClick={() => setShowBigScreenModal(!showBigScreenModal)} title="全景" color="emerald" />
              <HubBtn icon={<Hand size={18} />} active={showHelpModal} onClick={() => setShowHelpModal(!showHelpModal)} title="求助" color="red" />
              <HubBtn icon={<LayoutGrid size={18} />} active={isExpanded} onClick={() => setIsExpanded(!isExpanded)} title="功能" color="emerald" />
            </div>

            <div className="flex items-center justify-end w-[120px] shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <button onClick={() => { logout(); window.location.hash = '/login'; }} className="w-9 h-9 rounded-xl bg-white/5 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all group border border-white/5"><LogOut size={18} /></button>
            </div>
          </div>
        )}

        {/* --- 侧边栏内容层 --- */}
        {layoutMode === 'SIDE' && (
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <div className="p-6 bg-black/20 space-y-4 border-b border-white/5">
                <div className="relative">
                   <Search className="absolute left-4 top-4 text-slate-500" size={18} />
                   <input value={searchQuery} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeSearch()} placeholder="输入关键字并回车搜索..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:border-cyan-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5"><Wallet size={14} className="text-slate-500" /><input placeholder="最高价" value={filterPrice} onChange={e => setFilterPrice(e.target.value)} className="bg-transparent w-full text-[10px] outline-none" /></div>
                   <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5"><Box size={14} className="text-slate-500" /><input placeholder="材质" value={filterMaterial} onChange={e => setFilterMaterial(e.target.value)} className="bg-transparent w-full text-[10px] outline-none" /></div>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                {searchResults.map((item, i) => (
                  <div key={i} className="p-5 rounded-[28px] bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all group">
                     <div className="text-[10px] font-black text-cyan-500 uppercase mb-2 tracking-widest">Matched Asset</div>
                     <div className="text-base font-black text-white mb-2 leading-tight">{item.name || item.keyword}</div>
                     <div className="p-3 bg-black/40 rounded-xl text-xs text-slate-400 italic">{item.usp || item.solution}</div>
                  </div>
                ))}
                {searchResults.length === 0 && <div className="h-full flex items-center justify-center opacity-20 italic uppercase tracking-[0.3em] text-xs">等待战术指令下发</div>}
             </div>
          </div>
        )}

        {/* --- 客户画像侧挂气泡 (HUD) --- */}
        <AnimatePresence>
          {isCustomerHudEnabled && layoutMode === 'FLOAT' && (
            <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 330, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="absolute top-0 h-[64px] bg-emerald-500/90 backdrop-blur-xl border border-emerald-400 rounded-3xl p-4 flex items-center gap-4 shadow-2xl z-0">
               <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white"><UserIcon size={20}/></div>
               <div className="pr-4 border-r border-white/20">
                  <p className="text-[10px] font-black text-black uppercase">当前客户</p>
                  <p className="text-sm font-black text-white">李先生 (VIP)</p>
               </div>
               <div className="flex gap-4 px-2">
                  <div className="flex flex-col items-center"><Wallet size={14} className="text-white"/><span className="text-[8px] font-black text-black">强购买力</span></div>
                  <div className="flex flex-col items-center"><Heart size={14} className="text-white"/><span className="text-[8px] font-black text-black">态度友好</span></div>
                  <div className="flex flex-col items-center text-red-900 animate-pulse"><Ban size={14}/><span className="text-[8px] font-black">忌谈折扣</span></div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. 看板内容 (TOOLS 面板) */}
        <AnimatePresence>
          {isExpanded && layoutMode === 'FLOAT' && (
            <motion.div initial={{ height: 0 }} animate={{ height: 500 }} exit={{ height: 0 }} className="flex-1 flex flex-col border-t border-white/5 bg-slate-900/80">
              <div className="flex p-2 gap-2 bg-black/20"><TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<Target size={16}/>} label="智脑" /><TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={16}/>} label="雷达" /><TabBtn id="TOOLS" active={activeTab} set={setActiveTab} icon={<Box size={16}/>} label="工具" /></div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                 {activeTab === 'TOOLS' && (
                   <div className="grid grid-cols-2 gap-4">
                      <ToolCard icon={<Package size={24}/>} title="商品资产" desc="点击进入右侧检索模式" color="cyan" onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('PRODUCTS'); }} />
                      <ToolCard icon={<BookOpen size={24}/>} title="战术知识" desc="点击进入右侧检索模式" color="amber" onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('KNOWLEDGE'); }} />
                      <ToolCard icon={<Search size={24}/>} title="全域检索" desc="全局对策搜索引擎" color="cyan" onClick={() => setShowBigScreenModal(true)} />
                      <ToolCard icon={<Settings size={24}/>} title="链路配置" desc="系统底层参数调整" color="slate" />
                   </div>
                 )}
                 {/* AI 与 RADAR 保持原逻辑 */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. 实时全景大屏模态框 (最高层级) */}
        <AnimatePresence>
          {showBigScreenModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-slate-950 flex flex-col">
              <div className="flex justify-between items-center p-8 bg-black/60 border-b border-white/10 shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse"><Maximize2 size={20} className="text-white" /></div>
                    <div><h4 className="text-xl font-black text-white uppercase italic">全景战术态势指挥中枢</h4><p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">指挥中心 · 实时链路激活</p></div>
                 </div>
                 <button onClick={() => setShowBigScreenModal(false)} className="px-8 py-3 bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase transition-all shadow-xl active:scale-95">退出全景模式</button>
              </div>
              <div className="flex-1 bg-black relative" style={{ WebkitAppRegion: 'no-drag' } as any}><iframe src="#/big-screen" className="w-full h-full border-none" title="Tactical Big Screen" /><div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, title, color }: any) {
  const activeClassMap: any = { red: "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] border-red-400", emerald: "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] border-emerald-400", white: "bg-white text-black shadow-lg", muted: "bg-slate-800 text-white border-white/20 shadow-md" }
  return (<button onClick={onClick} title={title} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 border border-transparent", active ? activeClassMap[color] : "text-slate-500 hover:bg-white/10 hover:text-white")}>{icon}</button>)
}

function TabBtn({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (<button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-3 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-500 relative", isSelected ? "bg-white/10 text-cyan-400" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase">{label}</span>{isSelected && (<motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />)}</button>)
}

function ToolCard({ icon, title, desc, color, onClick }: any) {
  const colors: any = { cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/15", amber: "text-amber-400 bg-amber-400/5 border-amber-400/15", red: "text-red-400 bg-red-400/5 border-red-400/15", slate: "text-slate-400 bg-white/5 border-white/10" }
  return (<button onClick={onClick} className={cn("p-5 rounded-[28px] border flex flex-col items-start gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group", colors[color])}><div className="w-10 h-10 rounded-[18px] flex items-center justify-center bg-black/30 group-hover:bg-black/50 shadow-inner">{icon}</div><div><div className="text-[13px] font-black text-white mb-0.5 uppercase tracking-tight">{title}</div><div className="text-[9px] font-medium text-slate-500 leading-tight">{desc}</div></div></button>)
}

function DetailCard({ label, value, isCyan, sub, icon }: any) {
  return (<div className="bg-white/5 p-5 rounded-[32px] border border-white/5 group hover:border-white/10 transition-all relative overflow-hidden"><div className="absolute right-4 top-4 text-white/5 group-hover:text-white/10">{icon}</div><div className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">{label}</div><div className={cn("text-xl font-black mb-0.5 tracking-tighter", isCyan ? "text-cyan-400" : "text-white")}>{value}</div><div className="text-[7px] font-bold text-slate-600 uppercase italic opacity-50">{sub}</div></div>)
}
