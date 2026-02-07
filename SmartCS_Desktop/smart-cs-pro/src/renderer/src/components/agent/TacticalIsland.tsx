import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban, Undo2,
  UserSearch, Layers, Star, Info, Link2, ScanEye, Crosshair, HelpCircle, ChevronsLeft, ChevronsRight, Loader2, Brain, PenTool, Send,
  AlertTriangle, ChevronDown, Check
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn, tacticalRequest } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { toast } from 'sonner'

export const TacticalIsland = () => {
  const { 
    isAlerting, isOnline, violations, isGlassMode, setGlassMode,
    layoutMode, setLayoutMode, activeSideTool, setActiveSideTool,
    isCustomerHudEnabled, setCustomerHudEnabled, currentCustomer, setCurrentCustomer,
    isOnboardingMode, setOnboardingMode, isMuted, setMuted, isLocked
  } = useRiskStore()
  
  const { user, logout } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFolded, setIsFolded] = useState(false) 
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)
  
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showCriticalAlert, setShowCriticalAlert] = useState(false)

  // 核心：战术草稿与话术推送逻辑 (V3.32)
  const [content, setContent] = useState('') 
  const [isPushMode, setIsPushMode] = useState(false)
  const [isScratchpad, setIsScratchpad] = useState(false)
  const [sentiments, setSentiments] = useState<any[]>([])
  const [selectedSentiment, setSelectedSentiment] = useState<any>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [hasOptimized, setHasOptimized] = useState(false)
  const [sentimentSearch, setSentimentSearch] = useState('')
  const [showSentimentDropdown, setShowSentimentDropdown] = useState(false)

  // 战术规避模式 (V3.30)
  const [isEvasionMode, setIsEvasionMode] = useState(false)
  const [evasionInfo, setEvasionInfo] = useState<any>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchSentiments = async () => {

      try {

        console.log('📡 [Island] Fetching Sentiments...')

        const res = await window.api.callApi({ 

          url: `${CONFIG.API_BASE}/ai/sentiments`, 

          method: 'GET', 

          headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` } 

        })

        if (res.status === 200) {

          console.log('✅ [Island] Sentiments Loaded:', res.data.data)

          setSentiments(res.data.data)

          const neutral = res.data.data.find((s: any) => s.name.includes('中性') || s.id === 0) || res.data.data[0]

          setSelectedSentiment(neutral)

        }

      } catch (e) { console.error('❌ [Island] Load Sentiments Failed:', e) }

    }

  

    useEffect(() => {

      fetchSentiments()

      // 关键修正：统一指令接收中心

      const onCommand = (e: any) => {

        const data = e.detail;

        console.log(`⚡ [Tactical Link] New Command: ${data.type}`, data);

        

        if (data.type === 'TACTICAL_PUSH') {

          setContent(data.payload.content)

          setIsPushMode(true)

          setIsScratchpad(false)

          setIsEvasionMode(false)

          setHasOptimized(false)

          window.electron.ipcRenderer.send('set-always-on-top', true)

        }

        

        if (data.type === 'TACTICAL_DEPT_VIOLATION') {

          setEvasionInfo(data)

          setIsEvasionMode(true)

          setIsPushMode(false)

          setIsScratchpad(false)

          // 物理干预

          window.api.callApi({ url: `http://localhost:8000/api/system/clear-input`, method: 'POST' })

        }

      }

      

      window.addEventListener('ws-tactical-command', onCommand)

      return () => {

        window.removeEventListener('ws-tactical-command', onCommand)

      }

    }, [])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSentimentDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSentiments = useMemo(() => {
    return sentiments.filter(s => s.name.toLowerCase().includes(sentimentSearch.toLowerCase()))
  }, [sentiments, sentimentSearch])

  const optimizeScript = async () => {
    if (!content || !selectedSentiment) return
    setOptimizing(true)
    try {
      const prompt = `你是一个专业的客服教练。请根据以下[原话术]和[当前客户态度]，优化出一句最合适的回话。只返回优化后的内容，不要有任何废话。
      [原话术]: ${content}
      [当前客户态度]: ${selectedSentiment.name} (${selectedSentiment.prompt_segment})
      优化后的回话：`

      const serverConfig = await window.api.getServerConfig()
      const res = await fetch(serverConfig.ai_engine.url, {
        method: 'POST',
        body: JSON.stringify({ model: serverConfig.ai_engine.model, prompt, stream: false })
      })
      const data = await res.json()
      setContent(data.response)
      setHasOptimized(true)
      toast.success('AI 调优成功')
    } catch (e) {
      toast.error('AI 引擎未就绪')
    } finally { setOptimizing(false) }
  }

  const copyAndClose = () => {
    navigator.clipboard.writeText(content)
    toast.success('一键复制成功')
    setTimeout(() => { setIsPushMode(false); setIsScratchpad(false); setHasOptimized(false); }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!hasOptimized) optimizeScript()
      else copyAndClose()
    }
  }

  useEffect(() => {
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const active = isPushMode || isScratchpad || isEvasionMode
    
    let width = isFolded ? 80 : 800 
    let height = showHelpModal ? 480 : (isExpanded ? 564 : 72)
    let x: number | undefined = undefined
    let y: number | undefined = undefined
    let center = false

    if (isLocked) {
      width = screenWidth; height = screenHeight; x = 0; y = 0;
    } else if (active) {
      width = 800; height = 550; // V3.32: 增加高度适配上下布局
      x = screenWidth - 820; y = 30;
    } else if (showBigScreenModal) {
      width = 1280; height = 850; center = true
    } else if (layoutMode === 'SIDE') {
      width = 440; height = screenHeight - 80; x = screenWidth - 460; y = 40
    } else {
      x = isFolded ? screenWidth - 100 : screenWidth - 820
      y = 30
    }
    window.electron.ipcRenderer.send('resize-window', { width, height, center, x, y })
    window.electron.ipcRenderer.send('set-always-on-top', isLocked || active || !showBigScreenModal)
    
    if (isScratchpad && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isExpanded, showHelpModal, showBigScreenModal, layoutMode, isFolded, isLocked, isPushMode, isScratchpad, isEvasionMode])

  const isInSpecialMode = isPushMode || isScratchpad

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
          width: isLocked ? window.screen.width : (layoutMode === 'SIDE' ? 440 : (showBigScreenModal ? 1280 : (isFolded ? 80 : 800))),
          height: isLocked ? window.screen.height : (layoutMode === 'SIDE' ? 850 : (showBigScreenModal ? 850 : (isInSpecialMode || isEvasionMode ? 550 : (showHelpModal ? 480 : (isExpanded ? 564 : 72)))))
        }}
        className={cn(
          "pointer-events-auto border border-white/10 flex flex-col overflow-hidden transition-all duration-500 relative",
          isGlassMode ? "bg-slate-950/60 backdrop-blur-3xl shadow-none" : "bg-slate-950 shadow-none",
          (showBigScreenModal || layoutMode === 'SIDE' || isLocked) ? "rounded-none" : "rounded-3xl"
        )}
        style={{ backfaceVisibility: 'hidden', transform: 'translate3d(0,0,0)' } as any}
      >
        {isEvasionMode ? (
          <div className="flex-1 flex flex-col p-8 text-white overflow-hidden bg-amber-900/40">
             <div className="flex justify-between items-start mb-8 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce"><AlertTriangle size={24} className="text-black"/></div>
                   <div>
                      <h4 className="text-xl font-black italic tracking-tighter uppercase text-amber-400">战术规避拦截</h4>
                      <p className="text-[10px] font-bold text-amber-200/60 uppercase tracking-[0.3em] mt-0.5">Tactical Evasion Protocol</p>
                   </div>
                </div>
                <button onClick={() => setIsEvasionMode(false)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 font-black text-xs transition-all border border-white/10 text-amber-200"><Undo2 size={16}/> 关闭提示</button>
             </div>
             <div className="flex-1 flex flex-col items-center justify-center text-center px-10 gap-6">
                <div className="space-y-2">
                   <p className="text-sm font-bold text-amber-200/80 uppercase tracking-widest">检测到禁忌词项</p>
                   <div className="text-5xl font-black text-white italic tracking-tighter decoration-red-500 decoration-4 underline underline-offset-8">"{evasionInfo?.keyword}"</div>
                </div>
                <div className="w-full max-w-md p-6 bg-black/40 rounded-[32px] border border-amber-500/30 shadow-2xl">
                   <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><CheckCircle2 size={14}/> 修正建议</p>
                   <p className="text-lg font-medium leading-relaxed italic text-white">"{evasionInfo?.suggestion}"</p>
                </div>
                <p className="text-[10px] font-bold text-amber-200/40 uppercase tracking-[0.4em]">输入已物理清空 · 请使用建议语重新输入</p>
             </div>
          </div>
        ) : isInSpecialMode ? (
          <div className="flex-1 flex flex-col p-8 text-white overflow-hidden bg-slate-950/40">
             <div className="flex justify-between items-start mb-6 shrink-0">
                <div className="flex items-center gap-4">
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse", isPushMode ? "bg-cyan-600 shadow-cyan-500/20" : "bg-emerald-600 shadow-emerald-500/20")}>
                      {isPushMode ? <Sparkles size={24}/> : <PenTool size={24}/>}
                   </div>
                   <div>
                      <h4 className="text-xl font-black italic tracking-tighter uppercase">{isPushMode ? '指挥部战术支援' : '战术草稿箱'}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-0.5">{isPushMode ? 'Tactical Push Active' : 'Scratchpad Ready'}</p>
                   </div>
                </div>
                <button onClick={() => { setIsPushMode(false); setIsScratchpad(false); setHasOptimized(false); }} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 font-black text-xs transition-all border border-white/10 text-slate-300"><Undo2 size={16}/> 退出</button>
             </div>

             {/* V3.32: 升级为上下布局，优化视觉呼吸感 */}
             <div className="flex-1 flex flex-col gap-6 min-h-0">
                <div className="flex-1 flex flex-col">
                   <div className="flex-1 bg-black/40 rounded-[32px] border border-white/5 relative group p-1 shadow-inner focus-within:border-cyan-500/50 transition-all">
                      <div className="absolute top-4 right-6 text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 pointer-events-none z-10">
                         <MessageSquareText size={10}/> 编辑内容 (回车优化 / 再次回车复制)
                      </div>
                      <textarea
                        ref={inputRef}
                        value={content}
                        onChange={(e) => { setContent(e.target.value); setHasOptimized(false); }}
                        onKeyDown={handleKeyDown}
                        placeholder="请输入心里话..."
                        className="w-full h-full bg-transparent px-8 pt-12 pb-8 rounded-[32px] text-xl font-medium leading-relaxed italic text-white resize-none outline-none custom-scrollbar"
                      />
                   </div>
                </div>

                {/* 底部控制中心：情绪选择 + 动作按钮 */}
                <div className="flex items-center gap-4 h-20 shrink-0 bg-white/5 p-2 rounded-[24px] border border-white/5">
                   {/* 搜索式情绪下拉框 */}
                   <div className="relative w-64 h-full" ref={dropdownRef}>
                      <button 
                        onClick={() => setShowSentimentDropdown(!showSentimentDropdown)}
                        className="w-full h-full px-5 flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group"
                      >
                         <div className="flex items-center gap-3">
                            <Brain size={16} className={cn(selectedSentiment ? `text-${selectedSentiment.color}-400` : "text-slate-400")} />
                            <span className="text-xs font-black text-white truncate">{selectedSentiment?.name || '选择情绪'}</span>
                         </div>
                         <ChevronDown size={16} className={cn("text-slate-500 transition-transform", showSentimentDropdown && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {showSentimentDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="absolute bottom-full left-0 right-0 mb-3 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                          >
                             <div className="p-3 border-b border-white/5 bg-white/5">
                                <input 
                                  autoFocus
                                  value={sentimentSearch}
                                  onChange={(e) => setSentimentSearch(e.target.value)}
                                  placeholder="快速检索维度..."
                                  className="w-full bg-black/40 border-none rounded-lg px-3 py-2 text-[10px] font-bold text-white outline-none"
                                />
                             </div>
                             <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                                {filteredSentiments.map(s => (
                                  <button 
                                    key={s.id}
                                    onClick={() => { setSelectedSentiment(s); setHasOptimized(false); setShowSentimentDropdown(false); }}
                                    className={cn(
                                      "w-full px-4 py-2.5 rounded-xl flex items-center justify-between text-[10px] font-black transition-all hover:bg-white/5 text-left group",
                                      selectedSentiment?.id === s.id ? "bg-cyan-600/20 text-cyan-400" : "text-slate-400"
                                    )}
                                  >
                                     <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", `bg-${s.color}-500`)} />
                                        {s.name}
                                     </div>
                                     {selectedSentiment?.id === s.id && <Check size={12}/>}
                                  </button>
                                ))}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>

                   <button onClick={copyAndClose} className="px-6 h-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black transition-all border border-white/10 text-slate-300 group">
                      <ImageIcon size={18} className="text-slate-500 group-hover:text-white" /> 仅复制
                   </button>

                   <button 
                     disabled={optimizing || !selectedSentiment || !content}
                     onClick={optimizeScript}
                     className={cn(
                       "flex-1 h-full rounded-xl font-black text-sm uppercase shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30",
                       hasOptimized ? "bg-emerald-600 text-white" : "bg-cyan-600 text-white"
                     )}
                   >
                      {optimizing ? <Loader2 className="animate-spin" size={20}/> : (hasOptimized ? <CheckCircle2 size={20}/> : <Sparkles size={20}/>)}
                      {hasOptimized ? '再次回车确认复制' : 'AI 优化并替换 (Enter)'}
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <>
            {layoutMode === 'FLOAT' && (
              <div className="flex items-center px-4 h-[72px] shrink-0 relative" style={{ WebkitAppRegion: 'drag' } as any}>
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

                <div className="flex-1 flex items-center justify-end gap-2 pr-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
                  <AnimatePresence>
                    {!isFolded && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2">
                        <HubBtn icon={<Ghost size={20} />} active={!isGlassMode} onClick={() => setGlassMode(!isGlassMode)} title="外观" color="muted" />
                        <HubBtn icon={<GraduationCap size={20} />} active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} title="培训" color="emerald" />
                        <HubBtn icon={isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} active={isMuted} onClick={() => setMuted(!isMuted)} title={isMuted ? "解禁" : "静音"} color={isMuted ? "red" : "muted"} />
                        <div className="w-px h-5 bg-white/10 mx-0.5" />
                        <HubBtn icon={<PenTool size={20} />} active={isScratchpad} onClick={() => { setIsScratchpad(true); setContent(''); setHasOptimized(false); }} title="草稿" color="emerald" />
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
          </>
        )}
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, title, color }: any) {
  const activeClassMap: any = { red: "bg-red-500 text-white", emerald: "bg-emerald-500 text-white", white: "bg-white text-black", muted: "bg-slate-800 text-white" }
  return (
    <div className="relative group/btn shrink-0">
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