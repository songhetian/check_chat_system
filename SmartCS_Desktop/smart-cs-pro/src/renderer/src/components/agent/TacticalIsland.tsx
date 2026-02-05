import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban, Undo2
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
  const [showCriticalAlert, setShowCriticalAlert] = useState(false)

  // 1. 物理位置控制逻辑 (修正：FLOAT 模式停靠屏幕右上方)
  useEffect(() => {
    const screenWidth = window.screen.availWidth
    const screenHeight = window.screen.availHeight
    
    let width = 640
    let height = showHelpModal ? 480 : (isExpanded ? 564 : 64)
    let x: number | undefined = undefined
    let y: number | undefined = undefined
    let center = false // 永远不强制居中，除非是大屏

    if (showBigScreenModal) {
      width = 1280; height = 850; center = true
    } else if (layoutMode === 'SIDE') {
      width = 420; height = screenHeight - 100; x = screenWidth - 440; y = 50
    } else {
      // FLOAT 模式：固定在右上方 (留出一定边缘)
      width = 640; x = screenWidth - 680; y = 40
    }

    console.log(`📡 [物理调度] 模式: ${layoutMode} | 位置: ${x},${y} | 尺寸: ${width}x${height}`);
    window.electron.ipcRenderer.send('resize-window', { width, height, center, x, y })
    window.electron.ipcRenderer.send('set-always-on-top', !showBigScreenModal)
  }, [isExpanded, showHelpModal, showBigScreenModal, layoutMode])

  // 2. 战术对策实时检索
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!helpText || helpText.length < 2) { setHelpSuggestions([]); return; }
      const res = await tacticalRequest({
        url: `${CONFIG.API_BASE}/admin/violations?keyword=${helpText}&status=RESOLVED&size=2`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      if (res.status === 200) setHelpSuggestions(res.data.data);
    }, 500);
    return () => clearTimeout(timer);
  }, [helpText])

  // 3. 客户态度监控 (破屏警告)
  useEffect(() => {
    if (isCustomerHudEnabled && lastAiAnalysis?.sentiment_score && lastAiAnalysis.sentiment_score < -0.6) {
      setShowCriticalAlert(true);
      const t = setTimeout(() => setShowCriticalAlert(false), 6000);
      return () => clearTimeout(t);
    }
  }, [lastAiAnalysis, isCustomerHudEnabled])

  const executeSearch = async () => {
    const apiType = activeSideTool === 'PRODUCTS' ? 'products' : 'violations'; 
    let url = `${CONFIG.API_BASE}/admin/${apiType}?keyword=${searchQuery}&size=15`;
    if (filterPrice) url += `&max_price=${filterPrice}`;
    if (filterMaterial) url += `&material=${filterMaterial}`;
    const res = await tacticalRequest({ url, method: 'GET', headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` } });
    if (res.status === 200) setSearchResults(res.data.data);
  }

  const handleHelp = async (type: 'TEXT' | 'IMAGE') => {
    let payload: any = { type: 'EMERGENCY_HELP', subType: type }
    if (type === 'IMAGE' && window.api?.captureScreen) payload.image = await window.api.captureScreen()
    else payload.content = helpText
    window.dispatchEvent(new CustomEvent('send-risk-msg', { detail: payload }))
    setShowHelpModal(false); setHelpText('')
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none bg-transparent">
      <svg width="0" height="0" className="absolute"><defs><clipPath id="tactical-island-clip" clipPathUnits="objectBoundingBox"><rect x="0" y="0" width="1" height="1" rx="0.06" ry="0.06" /></clipPath></defs></svg>

      {/* --- 智脑全屏高危红色预警 --- */}
      <AnimatePresence>
        {showCriticalAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none bg-red-600/20 backdrop-blur-2xl">
             <div className="p-20 rounded-[64px] border-8 border-red-500 bg-black/90 flex flex-col items-center gap-10 shadow-[0_0_200px_rgba(239,68,68,1)]">
                <AlertOctagon size={180} className="text-red-500 animate-bounce" />
                <div className="text-center space-y-6">
                   <h2 className="text-8xl font-black text-white italic tracking-tighter uppercase">智脑战术警告</h2>
                   <p className="text-3xl font-black text-red-400 uppercase tracking-[0.4em]">检测到客户极度恶劣态度 · 请立即启用危机公关话术</p>
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
        {/* --- 1. 战术中枢条 (Main Bar) --- */}
        {layoutMode === 'FLOAT' && (
          <div className="flex items-center px-5 h-[64px] shrink-0 cursor-move relative" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex items-center gap-2.5 w-[120px] shrink-0">
              <div className="relative">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-500", isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-600 border border-white/5")}>{user?.real_name ? user.real_name[0] : <UserIcon size={18} />}</div>
                <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-slate-950", isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 animate-pulse")} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-black text-white truncate leading-none mb-1">{user?.real_name || '实战节点'}</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest truncate", isOnline ? "text-emerald-500" : "text-red-500")}>{isOnline ? '在线状态' : '脱机离线'}</span>
              </div>
            </div>

            {/* 核心功能按钮大集成 (图标放大至 20) */}
            <div className="flex-1 flex items-center justify-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <HubBtn icon={<Ghost size={20} />} active={!isGlassMode} onClick={() => setGlassMode(!isGlassMode)} title="外观切换" color="muted" />
              <HubBtn icon={<GraduationCap size={20} />} active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} title="实战培训" color="emerald" />
              <div className="w-px h-5 bg-white/10 mx-0.5" />
              <HubBtn icon={<Package size={20} />} active={activeSideTool === 'PRODUCTS'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('PRODUCTS'); }} title="商品资产" color="white" />
              <HubBtn icon={<BookOpen size={20} />} active={activeSideTool === 'KNOWLEDGE'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('KNOWLEDGE'); }} title="战术知识" color="white" />
              <HubBtn icon={<Tags size={20} />} active={isCustomerHudEnabled} onClick={() => setCustomerHudEnabled(!isCustomerHudEnabled)} title="客户画像" color="emerald" />
              <div className="w-px h-5 bg-white/10 mx-0.5" />
              <HubBtn icon={<Globe size={20} />} active={showBigScreenModal} onClick={() => setShowBigScreenModal(!showBigScreenModal)} title="全景看板" color="emerald" />
              <HubBtn icon={<Hand size={20} />} active={showHelpModal} onClick={() => setShowHelpModal(!showHelpModal)} title="战术求助" color="red" />
              <HubBtn icon={<LayoutGrid size={20} />} active={isExpanded} onClick={() => setIsExpanded(!isExpanded)} title="功能面板" color="muted" />
            </div>

            <div className="flex items-center justify-end w-[120px] shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <button onClick={() => { logout(); window.location.hash = '/login'; }} className="w-9 h-9 rounded-xl bg-white/5 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all border border-white/5"><LogOut size={20} /></button>
            </div>
          </div>
        )}

        {/* --- 2. 侧边战术检索面板 --- */}
        {layoutMode === 'SIDE' && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <div className="p-8 bg-cyan-500 text-slate-950 flex justify-between items-center shrink-0">
                <button onClick={() => { setLayoutMode('FLOAT'); setActiveSideTool(null); setIsExpanded(false); }} className="px-5 py-2 bg-black/10 hover:bg-black/20 rounded-xl flex items-center gap-2 font-black text-[11px] uppercase transition-all shadow-inner"><Undo2 size={16}/> 返回战术岛</button>
                <div className="flex items-center gap-3">
                   {activeSideTool === 'PRODUCTS' ? <Package size={24}/> : <BookOpen size={24}/>}
                   <h4 className="text-xl font-black italic tracking-tighter uppercase">{activeSideTool === 'PRODUCTS' ? '商品资产库' : '战术知识矩阵'}</h4>
                </div>
             </div>
             
             <div className="p-8 bg-black/40 space-y-6 border-b border-white/10">
                <div className="relative">
                   <Search className="absolute left-5 top-5 text-cyan-500/50" size={20} />
                   <input value={searchQuery} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeSearch()} placeholder="输入关键字并按回车搜索..." className="w-full bg-white/5 border-2 border-white/10 rounded-[24px] py-5 pl-14 pr-8 text-base text-white focus:border-cyan-500 outline-none transition-all font-bold placeholder:text-slate-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5"><Wallet size={16} className="text-cyan-500" /><input placeholder="最高价格" value={filterPrice} onChange={e => setFilterPrice(e.target.value)} className="bg-transparent w-full text-xs outline-none text-white font-black" /></div>
                   <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5"><Box size={16} className="text-cyan-500" /><input placeholder="材质/规格" value={filterMaterial} onChange={e => setFilterMaterial(e.target.value)} className="bg-transparent w-full text-xs outline-none text-white font-black" /></div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 bg-gradient-to-b from-transparent to-cyan-500/5">
                {searchResults.map((item, i) => (
                  <div key={i} className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 transition-all group relative overflow-hidden">
                     <div className="text-[10px] font-black text-cyan-500 uppercase mb-3 tracking-[0.2em]">{activeSideTool === 'PRODUCTS' ? 'ASSET IDENTIFIED' : 'STRATEGY MATCHED'}</div>
                     <div className="text-2xl font-black text-white mb-3 leading-tight italic">{item.name || item.keyword}</div>
                     <div className="p-5 bg-black/60 rounded-3xl text-sm text-slate-200 font-medium italic border border-white/5 leading-relaxed shadow-inner">"{item.usp || item.solution}"</div>
                  </div>
                ))}
                {searchResults.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-30 gap-6 grayscale"><RadarIcon size={80} strokeWidth={1} className="animate-spin-slow"/><p className="text-[11px] font-black uppercase tracking-[0.5em]">正在监听指令载荷...</p></div>}
             </div>
          </div>
        )}

        {/* --- 3. 客户画像侧挂气泡 --- */}
        <AnimatePresence>
          {isCustomerHudEnabled && layoutMode === 'FLOAT' && (
            <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 335, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="absolute top-0 h-[64px] bg-emerald-500/95 backdrop-blur-2xl border-2 border-emerald-400 rounded-[24px] p-4 flex items-center gap-5 shadow-[0_0_60px_rgba(16,185,129,0.5)] z-0">
               <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center text-white border border-white/10 shadow-inner"><UserIcon size={22}/></div>
               <div className="pr-5 border-r-2 border-white/20">
                  <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">当前接入客户</p>
                  <p className="text-base font-black text-white italic">李先生 · 核心VIP</p>
               </div>
               <div className="flex gap-6 px-3">
                  <div className="flex flex-col items-center gap-1"><Wallet size={18} className="text-emerald-950"/><span className="text-[9px] font-black text-white uppercase">强购买力</span></div>
                  <div className="flex flex-col items-center gap-1"><Heart size={18} className="text-emerald-950"/><span className="text-[9px] font-black text-white uppercase">态度友好</span></div>
                  <div className="flex flex-col items-center gap-1 text-red-900 animate-pulse"><Ban size={18}/><span className="text-[9px] font-black uppercase">忌谈折扣</span></div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- 4. 求助模态框 --- */}
        <AnimatePresence>
          {showHelpModal && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 416, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-8 border-t border-white/10 bg-slate-900 flex flex-col gap-6 rounded-b-[32px]">
              <div className="flex items-center gap-3 mb-2"><div className="w-1.5 h-4 bg-red-500 rounded-full" /><h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">发起紧急战术支援请求</h4></div>
              <div className="grid grid-cols-2 gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <button onClick={() => handleHelp('IMAGE')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 transition-all group"><div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-red-500"><ImageIcon size={20} /></div><div className="text-left"><p className="text-xs font-black text-white">截图求助</p><p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">物理载荷上传</p></div></button>
                 <button className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-cyan-500/10 transition-all group"><div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cyan-500"><MessageSquareText size={20} /></div><div className="text-left"><p className="text-xs font-black text-white">说明求助</p><p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">具体困境描述</p></div></button>
              </div>
              <div className="flex flex-col gap-4 flex-1 min-h-0">
                 <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <textarea value={helpText} onChange={(e) => setHelpText(e.target.value)} placeholder="描述困境，智脑将自动匹配解决库案例..." className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 focus:border-red-500/50 transition-all resize-none outline-none font-bold" />
                    <button onClick={() => handleHelp('TEXT')} className="absolute bottom-3 right-3 px-5 py-2 bg-red-500 text-white text-[10px] font-black rounded-xl hover:bg-red-600 transition-all shadow-lg uppercase">立即下发</button>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {helpSuggestions.length > 0 && (
                       <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20"><h5 className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2 mb-3 tracking-widest"><SearchCheck size={14}/> 发现匹配方案 · 建议优先尝试</h5>
                          {helpSuggestions.map((s, i) => (<div key={i} className="mb-2 last:mb-0 p-4 bg-black/40 rounded-2xl border border-white/5"><div className="text-[12px] font-black text-white mb-1">对策: {s.keyword}</div><div className="text-[11px] text-emerald-400/80 font-medium italic">方案: {s.solution}</div></div>))}
                       </div>
                    )}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. 全景大屏模态框 */}
        <AnimatePresence>
          {showBigScreenModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-slate-950 flex flex-col">
              <div className="flex justify-between items-center p-8 bg-black/60 border-b border-white/10 shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
                 <div className="flex items-center gap-4"><div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse"><Maximize2 size={20} className="text-white" /></div><div><h4 className="text-xl font-black text-white uppercase italic">全景战术态势指挥中枢</h4><p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">指挥中心 · 实时链路激活</p></div></div>
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
  const activeClassMap: any = { red: "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]", emerald: "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] border-emerald-400", white: "bg-white text-black shadow-lg", muted: "bg-slate-800 text-white border-white/20 shadow-md" }
  return (<button onClick={onClick} title={title} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 border border-transparent", active ? activeClassMap[color] : "text-slate-500 hover:bg-white/10 hover:text-white")}>{icon}</button>)
}

function TabBtn({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (<button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-500 relative", isSelected ? "bg-white/10 text-cyan-400" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase">{label}</span>{isSelected && (<motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />)}</button>)
}

function ToolCard({ icon, title, desc, color, onClick }: any) {
  const colors: any = { cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/15", amber: "text-amber-400 bg-amber-400/5 border-amber-400/15", red: "text-red-400 bg-red-400/5 border-red-400/15", slate: "text-slate-400 bg-white/5 border-white/10" }
  return (<button onClick={onClick} className={cn("p-5 rounded-[28px] border flex flex-col items-start gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group", colors[color])}><div className="w-10 h-10 rounded-[18px] flex items-center justify-center bg-black/30 group-hover:bg-black/50 shadow-inner">{icon}</div><div><div className="text-[13px] font-black text-white mb-0.5 uppercase tracking-tight">{title}</div><div className="text-[9px] font-medium text-slate-500 leading-tight">{desc}</div></div></button>)
}

function DetailCard({ label, value, isCyan, sub, icon }: any) {
  return (<div className="bg-white/5 p-5 rounded-[32px] border border-white/5 group hover:border-white/10 transition-all relative overflow-hidden"><div className="absolute right-4 top-4 text-white/5 group-hover:text-white/10">{icon}</div><div className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">{label}</div><div className={cn("text-xl font-black mb-0.5 tracking-tighter", isCyan ? "text-cyan-400" : "text-white")}>{value}</div><div className="text-[7px] font-bold text-slate-600 uppercase italic opacity-50">{sub}</div></div>)
}