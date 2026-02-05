import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban, Undo2,
  UserSearch, Layers, Star, Info
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
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)
  
  const [searchQuery, setSearchText] = useState('')
  const [filterPrice, setFilterPrice] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const [helpText, setHelpText] = useState('')
  const [helpSuggestions, setHelpSuggestions] = useState<any[]>([])
  const [showCriticalAlert, setShowCriticalAlert] = useState(false)

  // --- 测试数据模拟逻辑 (调试完成后可删除) ---
  useEffect(() => {
    if (isCustomerHudEnabled) {
      // 模拟识别到高价值客户
      setCurrentCustomer({
        name: "李先生",
        level: "钻石核心VIP",
        total_value: "128,400",
        attitude: "A+ 友好",
        insights: [
          { title: "极强购买力", desc: "对旗舰系列、新款极度敏感，建议优先推介。", color: "emerald", icon: <Wallet size={16}/> },
          { title: "沟通忌讳点", desc: "禁止提及“折扣”，会导致客户产生不信任感。", color: "red", icon: <Ban size={16}/> }
        ]
      });
      // 自动弹出面板
      setLayoutMode('SIDE');
      setActiveSideTool('CUSTOMERS' as any);
    } else {
      setCurrentCustomer(null);
      if (activeSideTool === 'CUSTOMERS') {
        setLayoutMode('FLOAT');
        setActiveSideTool(null);
      }
    }
  }, [isCustomerHudEnabled])

  // 1. 物理停靠：FLOAT 模式停靠屏幕右上方
  useEffect(() => {
    const screenWidth = window.screen.availWidth
    const screenHeight = window.screen.availHeight
    let width = 580 
    let height = showHelpModal ? 480 : (isExpanded ? 564 : 64)
    let x: number | undefined = undefined
    let y: number | undefined = undefined
    let center = false

    if (showBigScreenModal) {
      width = 1280; height = 850; center = true
    } else if (layoutMode === 'SIDE') {
      width = 440; height = screenHeight - 80; x = screenWidth - 460; y = 40
    } else {
      width = 580; x = screenWidth - 600; y = 30
    }
    window.electron.ipcRenderer.send('resize-window', { width, height, center, x, y })
    window.electron.ipcRenderer.send('set-always-on-top', !showBigScreenModal)
  }, [isExpanded, showHelpModal, showBigScreenModal, layoutMode])

  // 2. 战术对策检索
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

  const executeSearch = async () => {
    const apiType = activeSideTool === 'PRODUCTS' ? 'products' : 'violations'; 
    let url = `${CONFIG.API_BASE}/admin/${apiType}?keyword=${searchQuery}&size=15`;
    if (filterPrice) url += `&max_price=${filterPrice}`;
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

      {/* 智脑警告层 */}
      <AnimatePresence>
        {showCriticalAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none bg-red-600/20 backdrop-blur-2xl px-20">
             <div className="p-16 rounded-[60px] border-8 border-red-500 bg-black/90 flex flex-col items-center gap-8 shadow-[0_0_150px_#ef4444]">
                <AlertOctagon size={140} className="text-red-500 animate-pulse" />
                <div className="text-center space-y-4">
                   <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase">智脑战术警告</h2>
                   <p className="text-2xl font-black text-red-400 uppercase tracking-[0.4em]">检测到客户极度恶劣态度 · 请立即启用危机公关话术</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout
        initial={false}
        animate={{ 
          width: layoutMode === 'SIDE' ? 440 : (showBigScreenModal ? 1280 : 580),
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
        {/* --- 1. 战术主条 (功能大集结 + 注销集成) --- */}
        {layoutMode === 'FLOAT' && (
          <div className="flex items-center px-4 h-[64px] shrink-0 cursor-move relative" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex items-center gap-2 w-[110px] shrink-0">
              <div className="relative">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-all duration-500", isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-slate-900 text-slate-600 border border-white/5")}>{user?.real_name ? user.real_name[0] : <UserIcon size={16} />}</div>
                <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-slate-950", isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 animate-pulse")} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-black text-white truncate leading-none mb-0.5">{user?.real_name || '实战节点'}</span>
                <span className={cn("text-[8px] font-bold uppercase tracking-widest truncate", isOnline ? "text-emerald-500" : "text-red-500")}>{isOnline ? '在线' : '离线'}</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
              {/* 图标尺寸缩小至 16px，容器 w-9 h-9 */}
              <HubBtn icon={<Ghost size={16} />} active={!isGlassMode} onClick={() => setGlassMode(!isGlassMode)} title="外观切换" color="muted" />
              <HubBtn icon={<GraduationCap size={16} />} active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} title="培训模式" color="emerald" />
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <HubBtn icon={<Package size={16} />} active={activeSideTool === 'PRODUCTS'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('PRODUCTS' as any); }} title="商品资产" color="white" />
              <HubBtn icon={<BookOpen size={16} />} active={activeSideTool === 'KNOWLEDGE'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('KNOWLEDGE' as any); }} title="战术知识" color="white" />
              <HubBtn icon={<Tags size={16} />} active={isCustomerHudEnabled} onClick={() => setCustomerHudEnabled(!isCustomerHudEnabled)} title="画像监控" color={isCustomerHudEnabled ? "emerald" : "white"} />
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <HubBtn icon={<Globe size={16} />} active={showBigScreenModal} onClick={() => setShowBigScreenModal(!showBigScreenModal)} title="全景视图" color="emerald" />
              <HubBtn icon={<Hand size={16} />} active={showHelpModal} onClick={() => setShowHelpModal(!showHelpModal)} title="战术求助" color="red" />
              <HubBtn icon={<LayoutGrid size={16} />} active={isExpanded} onClick={() => setIsExpanded(!isExpanded)} title="功能面板" color="muted" />
              {/* 新增：集成注销按钮 */}
              <HubBtn icon={<LogOut size={16} />} active={false} onClick={() => { logout(); window.location.hash = '/login'; }} title="注销登录" color="red" />
            </div>

            {/* 右侧占位 (保持左右平衡) */}
            <div className="w-[110px] shrink-0" />
          </div>
        )}

        {/* --- 2. 侧边战术面板 --- */}
        {layoutMode === 'SIDE' && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <div className="p-8 bg-cyan-600 text-white flex justify-between items-center shrink-0">
                <button onClick={() => { setLayoutMode('FLOAT'); setActiveSideTool(null); setIsExpanded(false); setCustomerHudEnabled(false); }} className="px-5 py-2.5 bg-black/20 hover:bg-black/40 rounded-xl flex items-center gap-2 font-black text-xs transition-all shadow-inner"><Undo2 size={18}/> 返回战术岛</button>
                <div className="flex items-center gap-3">
                   {activeSideTool === 'PRODUCTS' && <Package size={24}/>}
                   {activeSideTool === 'KNOWLEDGE' && <BookOpen size={24}/>}
                   {activeSideTool === 'CUSTOMERS' && <UserSearch size={24}/>}
                   <h4 className="text-xl font-black italic tracking-tighter uppercase">{activeSideTool === 'PRODUCTS' ? '资产库' : (activeSideTool === 'KNOWLEDGE' ? '知识库' : '实时画像')}</h4>
                </div>
             </div>
             
             {activeSideTool !== 'CUSTOMERS' ? (
               <div className="flex-1 flex flex-col">
                  <div className="p-8 bg-black/40 space-y-6 border-b border-white/10">
                     <div className="relative">
                        <Search className="absolute left-5 top-5 text-cyan-500/50" size={20} />
                        <input value={searchQuery} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeSearch()} placeholder={`搜索关键字并回车...`} className="w-full bg-white/5 border-2 border-white/10 rounded-[24px] py-5 pl-14 pr-8 text-base text-white focus:border-cyan-500 outline-none transition-all font-black placeholder:text-slate-600" />
                     </div>
                     {activeSideTool === 'PRODUCTS' && (
                       <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5"><Wallet size={16} className="text-cyan-500" /><input placeholder="价格过滤" value={filterPrice} onChange={e => setFilterPrice(e.target.value)} className="bg-transparent w-full text-sm outline-none text-white font-black" /></div>
                     )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                     {searchResults.map((item, i) => (
                       <div key={i} className={cn("p-6 rounded-[32px] bg-white/[0.03] border transition-all relative overflow-hidden", activeSideTool === 'PRODUCTS' ? "border-emerald-500/20 hover:border-emerald-500/50" : "border-cyan-500/20 hover:border-cyan-500/50")}>
                          <div className="text-[10px] font-black uppercase mb-3 tracking-[0.2em] flex justify-between items-center">
                             <span className={activeSideTool === 'PRODUCTS' ? "text-emerald-500" : "text-cyan-500"}>{activeSideTool === 'PRODUCTS' ? 'ASSET IDENTIFIED' : 'KNOWLEDGE MATCHED'}</span>
                             {item.price && <span className="text-red-500 font-black text-lg">¥{item.price}</span>}
                          </div>
                          <div className="text-xl font-black text-white mb-3 italic">{item.name || item.keyword}</div>
                          <div className="p-5 bg-black/60 rounded-3xl text-sm text-slate-200 border border-white/5 shadow-inner leading-relaxed italic">
                             {activeSideTool === 'PRODUCTS' ? <p>"{item.usp}"</p> : <p className="text-cyan-400/90 font-bold">方案: {item.solution}</p>}
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             ) : (
               <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in slide-in-from-right-4">
                  <div className="p-8 rounded-[40px] bg-emerald-500 text-slate-950 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-20"><Trophy size={80}/></div>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center border border-black/10"><UserIcon size={32}/></div>
                        <div><h2 className="text-3xl font-black italic tracking-tighter leading-none mb-1">{currentCustomer?.name}</h2><span className="text-[10px] font-black uppercase bg-black/10 px-2 py-0.5 rounded-md">核心钻石 · 终身VIP</span></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/10 p-4 rounded-3xl border border-black/5"><p className="text-[10px] font-black opacity-60 uppercase mb-1">历史贡献值</p><p className="text-2xl font-black italic">¥{currentCustomer?.total_value}</p></div>
                        <div className="bg-black/10 p-4 rounded-3xl border border-black/5"><p className="text-[10px] font-black opacity-60 uppercase mb-1">实战态度分</p><p className="text-2xl font-black italic">{currentCustomer?.attitude}</p></div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h5 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-2 px-2"><Target size={16}/> 智脑风险洞察</h5>
                     {currentCustomer?.insights.map((ins: any, idx: number) => (
                       <InsightCard key={idx} title={ins.title} desc={ins.desc} color={ins.color} icon={ins.icon} />
                     ))}
                  </div>
               </div>
             )}
          </div>
        )}

        {/* --- 3. 求助模态框 --- */}
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
                    <textarea value={helpText} onChange={(e) => setHelpText(e.target.value)} placeholder="描述困境，智脑将自动匹配对策..." className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 focus:border-red-500/50 transition-all resize-none outline-none font-bold" />
                    <button onClick={() => handleHelp('TEXT')} className="absolute bottom-3 right-3 px-5 py-2 bg-red-500 text-white text-[10px] font-black rounded-xl hover:bg-red-600 transition-all shadow-lg">立即下发</button>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {helpSuggestions.length > 0 && (
                       <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20"><h5 className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2 mb-3 tracking-widest"><SearchCheck size={14}/> 发现对策建议 · 优先尝试自救</h5>
                          {helpSuggestions.map((s, i) => (<div key={i} className="mb-2 p-4 bg-black/40 rounded-2xl border border-white/5"><div className="text-[12px] font-black text-white mb-1">策略: {s.keyword}</div><div className="text-[11px] text-emerald-400/80 font-medium italic">方案: {s.solution}</div></div>))}
                       </div>
                    )}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, title, color }: any) {
  const activeClassMap: any = { red: "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]", emerald: "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]", white: "bg-white text-black shadow-lg", muted: "bg-slate-800 text-white border-white/20 shadow-md" }
  return (<button onClick={onClick} title={title} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 border border-transparent", active ? activeClassMap[color] : "text-slate-500 hover:bg-white/10 hover:text-white")}>{icon}</button>)
}

function InsightCard({ title, desc, color, icon }: any) {
  const colors: any = { emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", red: "bg-red-500/10 border-red-500/20 text-red-400", cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" }
  return (<div className={cn("p-5 rounded-3xl border flex gap-4 transition-all hover:bg-white/5", colors[color])}><div className="shrink-0 mt-1">{icon}</div><div><p className="text-sm font-black mb-1">{title}</p><p className="text-[11px] font-medium leading-relaxed opacity-80">{desc}</p></div></div>)
}