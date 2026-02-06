import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban, Undo2,
  UserSearch, Layers, Star, Info, Link2, ScanEye, Crosshair, HelpCircle
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
    isOnboardingMode, setOnboardingMode
  } = useRiskStore()
  
  const { user, logout } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)
  const [showCalibration, setShowCalibration] = useState(false)
  
  const [searchQuery, setSearchText] = useState('')
  const [filterPrice, setFilterPrice] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const [helpText, setHelpText] = useState('')
  const [showCriticalAlert, setShowCriticalAlert] = useState(false)

  // --- 测试数据池 ---
  const mockCustomers = useMemo(() => [
    {
      name: "李先生",
      level: "钻石级 VIP",
      total_value: "128,400",
      attitude: "A+ 友好",
      insights: [
        { title: "极强购买力", desc: "对旗舰系列、新款极度敏感，建议优先推介。", color: "emerald", icon: <Wallet size={16}/> },
        { title: "沟通忌讳点", desc: "禁止提及“折扣”，会导致客户产生不信任感。", color: "red", icon: <Ban size={16}/> }
      ]
    },
    {
      name: "未知访客",
      level: "普通潜客",
      total_value: "0",
      attitude: "C- 恶劣",
      insights: [
        { title: "高风险预警", desc: "检测到多次使用否定词，情绪极度不稳定。", color: "red", icon: <AlertCircle size={16}/> }
      ]
    }
  ], []);

  // 1. 画像监控逻辑
  useEffect(() => {
    if (isCustomerHudEnabled) {
      setCurrentCustomer(mockCustomers[0]);
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

  // 2. 物理停靠逻辑
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

  // 3. 态度风险监控
  useEffect(() => {
    if (currentCustomer?.attitude?.includes('恶劣')) {
      setShowCriticalAlert(true);
      setTimeout(() => setShowCriticalAlert(false), 5000);
    }
  }, [currentCustomer])

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

      <AnimatePresence>
        {showCriticalAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none bg-red-600/20 backdrop-blur-2xl">
             <div className="p-16 rounded-xl bg-black/40 border-2 border-red-500 shadow-2xl">
                <AlertOctagon size={140} className="text-red-500 animate-pulse mx-auto mb-8" />
                <div className="text-center space-y-4">
                   <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase">智脑战术警告</h2>
                   <p className="text-2xl font-black text-red-400 uppercase tracking-[0.4em]">检测到客户态度极其恶劣 · 请立即启用危机公关话术</p>
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
          height: layoutMode === 'SIDE' ? 850 : (showBigScreenModal ? 850 : (showHelpModal ? 480 : (isExpanded ? 564 : 64)))
        }}
        className={cn(
          "pointer-events-auto border border-white/10 flex flex-col overflow-hidden transition-all duration-500 shadow-2xl relative",
          isGlassMode ? "bg-slate-950/30 backdrop-blur-3xl" : "bg-slate-950",
          (showBigScreenModal || layoutMode === 'SIDE') ? "rounded-none" : "rounded-xl"
        )}
      >
        {layoutMode === 'FLOAT' && (
          <div className="flex items-center px-4 h-[64px] shrink-0 cursor-move relative" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex items-center gap-2 w-[110px] shrink-0">
              <div className="relative">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm", isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-600 border border-white/5")}>{user?.real_name ? user.real_name[0] : <UserIcon size={16} />}</div>
                <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-slate-950", isOnline ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-black text-white truncate leading-none mb-0.5">{user?.real_name || '成员'}</span>
                <span className={cn("text-[8px] font-bold uppercase tracking-widest truncate", isOnline ? "text-emerald-500" : "text-red-500")}>{isOnline ? '在线' : '离线'}</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <HubBtn icon={<Ghost size={16} />} active={!isGlassMode} onClick={() => setGlassMode(!isGlassMode)} title="外观" color="muted" />
              <HubBtn icon={<GraduationCap size={16} />} active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} title="培训" color="emerald" />
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <HubBtn icon={<Package size={16} />} active={activeSideTool === 'PRODUCTS'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('PRODUCTS' as any); }} title="商品资产" color="white" />
              <HubBtn icon={<BookOpen size={16} />} active={activeSideTool === 'KNOWLEDGE'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('KNOWLEDGE' as any); }} title="战术知识" color="white" />
              <HubBtn icon={<Tags size={16} />} active={isCustomerHudEnabled} onClick={() => setCustomerHudEnabled(!isCustomerHudEnabled)} title="画像监控" color={isCustomerHudEnabled ? "emerald" : "white"} />
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <HubBtn icon={<Globe size={16} />} active={showBigScreenModal} onClick={() => setShowBigScreenModal(!showBigScreenModal)} title="全景视图" color="emerald" />
              <HubBtn icon={<Hand size={16} />} active={showHelpModal} onClick={() => setShowHelpModal(!showHelpModal)} title="战术求助" color="red" />
              <HubBtn icon={<LayoutGrid size={16} />} active={isExpanded} onClick={() => setIsExpanded(!isExpanded)} title="功能面板" color="muted" />
              <HubBtn icon={<LogOut size={16} />} active={false} onClick={() => { logout(); window.location.hash = '/login'; }} title="注销" color="red" />
            </div>
            <div className="w-[110px] shrink-0" />
          </div>
        )}

        {layoutMode === 'SIDE' && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <div className="p-6 bg-cyan-600 text-white flex justify-between items-center shrink-0">
                <button onClick={() => { setLayoutMode('FLOAT'); setActiveSideTool(null); setIsExpanded(false); }} className="px-4 py-2 bg-black/20 hover:bg-black/40 rounded-lg flex items-center gap-2 font-black text-xs transition-all shadow-inner"><Undo2 size={16}/> 返回</button>
                <h4 className="text-lg font-black italic tracking-tighter uppercase">{activeSideTool === 'PRODUCTS' ? '商品资产' : (activeSideTool === 'KNOWLEDGE' ? '知识矩阵' : '客户洞察')}</h4>
             </div>
             {activeSideTool === 'CUSTOMERS' ? (
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="p-6 rounded-xl bg-emerald-500 text-slate-950 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-20"><Trophy size={60}/></div>
                     <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center border border-black/10"><UserIcon size={24}/></div><div><h2 className="text-2xl font-black mb-1">{currentCustomer?.name}</h2><span className="text-[10px] font-black uppercase bg-black/10 px-2 py-0.5 rounded-md">{currentCustomer?.level}</span></div></div>
                     <div className="grid grid-cols-2 gap-3"><div className="bg-black/10 p-3 rounded-lg border border-black/5"><p className="text-[9px] font-black opacity-60 uppercase mb-1">历史价值</p><p className="text-xl font-black italic">¥{currentCustomer?.total_value}</p></div><div className="bg-black/10 p-3 rounded-lg border border-black/5"><p className="text-[9px] font-black opacity-60 uppercase mb-1">智脑态度</p><p className="text-xl font-black italic">{currentCustomer?.attitude}</p></div></div>
                  </div>
                  <div className="flex gap-2 p-1.5 bg-white/5 rounded-lg border border-white/5"><button onClick={() => { setCurrentCustomer(mockCustomers[0]); setShowCriticalAlert(false); }} className={cn("flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all", currentCustomer?.name === '李先生' ? "bg-emerald-500 text-black" : "bg-white/5 text-slate-500")}>模拟 VIP</button><button onClick={() => { setCurrentCustomer(mockCustomers[1]); setShowCriticalAlert(true); }} className={cn("flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all", currentCustomer?.name === '未知访客' ? "bg-red-500 text-white" : "bg-white/5 text-slate-500")}>模拟 恶劣客户</button></div>
                  <div className="space-y-3">{currentCustomer?.insights.map((ins: any, idx: number) => (<InsightCard key={idx} title={ins.title} desc={ins.desc} color={ins.color} icon={ins.icon} />))}</div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col">
                  <div className="p-6 bg-black/40 space-y-4 border-b border-white/10">
                    <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50" size={16} /><input value={searchQuery} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeSearch()} placeholder={`搜索...`} className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-cyan-500 outline-none transition-all font-bold" /></div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                    {searchResults.map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
                        <div className="text-[9px] font-black uppercase mb-2 tracking-widest flex justify-between items-center"><span className={activeSideTool === 'PRODUCTS' ? "text-emerald-500" : "text-cyan-500"}>{activeSideTool === 'PRODUCTS' ? 'ASSET' : 'MANUAL'}</span>{item.price && <span className="text-red-500 font-black text-sm">¥{item.price}</span>}</div>
                        <div className="text-base font-black text-white mb-2 italic">{item.name || item.keyword}</div>
                        <div className="p-3 bg-black/60 rounded-lg text-xs text-slate-200 border border-white/5 shadow-inner italic leading-relaxed">"{item.usp || item.solution}"</div>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        )}

        <AnimatePresence>
          {showHelpModal && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 416, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-6 border-t border-white/10 bg-slate-900 flex flex-col gap-4 rounded-b-xl">
              <div className="flex items-center gap-3 mb-1"><div className="w-1 h-4 bg-red-500 rounded-full" /><h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">发起紧急战术支援</h4></div>
              <div className="grid grid-cols-2 gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <button onClick={() => handleHelp('IMAGE')} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 transition-all group"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-red-500"><ImageIcon size={16} /></div><div className="text-left"><p className="text-xs font-black text-white leading-none">截图求助</p><p className="text-[8px] text-slate-500 mt-1 uppercase">物理载荷</p></div></button>
                 <button onClick={() => {}} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-cyan-500/10 transition-all group"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cyan-500"><MessageSquareText size={16} /></div><div className="text-left"><p className="text-xs font-black text-white leading-none">文字说明</p><p className="text-[8px] text-slate-500 mt-1 uppercase">详情描述</p></div></button>
              </div>
              <div className="flex flex-col gap-3 flex-1 min-h-0">
                 <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <textarea value={helpText} onChange={(e) => setHelpText(e.target.value)} placeholder="描述困境，智脑将自动匹配对策..." className="w-full h-24 bg-black/40 border border-white/5 rounded-lg p-3 text-xs text-slate-300 focus:border-red-500/50 transition-all resize-none outline-none font-bold" />
                    <button onClick={() => handleHelp('TEXT')} className="absolute bottom-3 right-3 px-4 py-1.5 bg-red-500 text-white text-[10px] font-black rounded-lg hover:bg-red-600 transition-all shadow-lg uppercase">提交</button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded && layoutMode === 'FLOAT' && (
            <motion.div initial={{ height: 0 }} animate={{ height: 500 }} exit={{ height: 0 }} className="flex-1 flex flex-col border-t border-white/5 bg-slate-950">
              <div className="flex p-2 gap-2 bg-black/40">
                 <TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<Target size={16}/>} label="智脑" />
                 <TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={16}/>} label="雷达" />
                 <TabBtn id="TOOLS" active={activeTab} set={setActiveTab} icon={<Box size={16}/>} label="工具" />
              </div>
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                 {activeTab === 'AI' && (<div className="p-10 text-center opacity-20 italic text-white text-xs">智脑对策逻辑已集成</div>)}
                 {activeTab === 'RADAR' && (<div className="space-y-2">{violations.slice(0, 5).map((v, i) => (<div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5"><div className="flex justify-between items-center mb-1"><span className="text-[9px] font-black text-red-500 uppercase">Intercepted</span><span className="text-[8px] font-mono text-slate-500">{new Date(v.timestamp).toLocaleTimeString()}</span></div><p className="text-[10px] text-slate-200 truncate">"{v.context}"</p></div>))}</div>)}
                 {activeTab === 'TOOLS' && (
                   <div className="grid grid-cols-2 gap-3">
                      <ToolCard icon={<Package size={20}/>} title="商品资产" desc="战术库" color="cyan" onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('PRODUCTS' as any); }} />
                      <ToolCard icon={<BookOpen size={20}/>} title="战术知识" desc="手册" color="amber" onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('KNOWLEDGE' as any); }} />
                      <ToolCard icon={<Crosshair size={20}/>} title="物理校准" desc="同步坐标" color="slate" onClick={() => setShowCalibration(true)} />
                      <ToolCard icon={<Settings size={20}/>} title="系统配置" desc="参数" color="slate" onClick={()=>{}} />
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBigScreenModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-slate-950 flex flex-col">
              <div className="flex justify-between items-center p-6 bg-black/60 border-b border-white/10 shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
                 <div className="flex items-center gap-4"><div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg animate-pulse"><Maximize2 size={20} className="text-white" /></div><div><h4 className="text-xl font-black text-white uppercase italic leading-none">全景指挥中枢</h4><p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">指挥中心 · 实时链路已激活</p></div></div>
                 <button onClick={() => setShowBigScreenModal(false)} className="px-6 py-2.5 bg-red-500 text-white rounded-lg text-xs font-black uppercase transition-all shadow-xl">退出全景</button>
              </div>
              <div className="flex-1 bg-black relative" style={{ WebkitAppRegion: 'no-drag' } as any}><iframe src="#/big-screen" className="w-full h-full border-none" title="Tactical Big Screen" /><div className="absolute inset-0 pointer-events-none border border-white/5 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, title, color }: any) {
  const activeClassMap: any = { red: "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]", emerald: "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]", white: "bg-white text-black shadow-lg", muted: "bg-slate-800 text-white border-white/20" }
  return (<button onClick={onClick} title={title} className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 active:scale-90", active ? activeClassMap[color] : "text-slate-500 hover:bg-white/10 hover:text-white")}>{icon}</button>)
}

function TabBtn({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (<button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all relative", isSelected ? "bg-white/10 text-cyan-400" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase">{label}</span>{isSelected && (<motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />)}</button>)
}

function InsightCard({ title, desc, color, icon }: any) {
  const colors: any = { emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", red: "bg-red-500/10 border-red-500/20 text-red-400", cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" }
  return (<div className={cn("p-4 rounded-xl border flex gap-3 transition-all hover:bg-white/5", colors[color])}><div className="shrink-0 mt-1">{icon}</div><div><p className="text-xs font-black mb-1">{title}</p><p className="text-[10px] font-medium leading-relaxed opacity-80">{desc}</p></div></div>)
}

function ToolCard({ icon, title, desc, color, onClick }: any) {
  const colors: any = { cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/15", amber: "text-amber-400 bg-amber-400/5 border-amber-400/15", red: "text-red-400 bg-red-400/5 border-red-400/15", slate: "text-slate-400 bg-white/5 border-white/10" }
  return (<button onClick={onClick} className={cn("p-4 rounded-xl border flex flex-col gap-2 transition-all hover:scale-[1.02] text-left", colors[color])}><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/30 shadow-inner">{icon}</div><div><div className="text-xs font-black uppercase mb-0.5">{title}</div><div className="text-[9px] opacity-60 leading-tight">{desc}</div></div></button>)
}